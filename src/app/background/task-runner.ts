import { ApiError, getJwt } from '../../shared/api';
import {
	resultKey,
	stateKey,
	TASK_SCOPES,
	TaskDataMap,
	TaskParamsMap,
	TaskResult,
	TaskScope,
	TaskState,
} from '../../shared/tasks';
import { fetchProjectIncome } from './tasks/project-income';
import { fetchVacations } from './tasks/vacations';
import { fetchWorkLogs } from './tasks/work-logs';

export type TaskContext = {
	jwt: string;
	signal: AbortSignal;
	report: (progress: string) => void;
};

type TaskHandler<S extends TaskScope> = (
	params: TaskParamsMap[S],
	ctx: TaskContext
) => Promise<TaskDataMap[S]>;

const handlers: { [S in TaskScope]: TaskHandler<S> } = {
	projectIncome: fetchProjectIncome,
	workLogs: fetchWorkLogs,
	vacations: fetchVacations,
};

const running = new Map<TaskScope, AbortController>();

// Any task still marked as loading when the service worker boots was killed
// together with the previous worker, so it can never finish. Clear it so the
// popup doesn't show a spinner forever.
const ready = (async () => {
	const keys = TASK_SCOPES.map(stateKey);
	const states: Record<string, TaskState<TaskScope> | undefined> =
		await chrome.storage.local.get(keys);
	const orphaned = keys.filter(key => states[key]?.status === 'loading');
	if (orphaned.length) await chrome.storage.local.remove(orphaned);
})().catch(error => console.error('Failed to clear orphaned tasks:', error));

// MV3 service workers are stopped after ~30s without extension API activity,
// and in-flight fetches alone don't count. Ping an API while tasks run.
let keepAliveTimer: ReturnType<typeof setInterval> | undefined;
const updateKeepAlive = () => {
	if (running.size && !keepAliveTimer) {
		keepAliveTimer = setInterval(() => chrome.runtime.getPlatformInfo(), 20_000);
	} else if (!running.size && keepAliveTimer) {
		clearInterval(keepAliveTimer);
		keepAliveTimer = undefined;
	}
};

const errorMessage = (error: unknown) =>
	error instanceof ApiError
		? error.message
		: 'Something went wrong while fetching data. Try again.';

// Starts a task and resolves once its loading state is persisted, so the
// caller can acknowledge the request immediately. The task keeps running.
export async function startTask<S extends TaskScope>(
	scope: S,
	params: TaskParamsMap[S]
): Promise<void> {
	await ready;
	if (running.has(scope)) return;

	const controller = new AbortController();
	running.set(scope, controller);
	updateKeepAlive();

	let lastProgress = '';
	const writeState = (state: Omit<TaskState<S>, 'params' | 'timestamp'>) =>
		chrome.storage.local.set({
			[stateKey(scope)]: { ...state, params, timestamp: Date.now() },
		});

	const report = (progress: string) => {
		if (controller.signal.aborted || progress === lastProgress) return;
		lastProgress = progress;
		writeState({ status: 'loading', progress });
	};

	await writeState({ status: 'loading', progress: 'Starting...' });

	void (async () => {
		try {
			const jwt = await getJwt();
			if (!jwt) {
				throw new ApiError(
					'You are not logged in to ITFin. Log in and try again.'
				);
			}

			const handler = handlers[scope] as TaskHandler<S>;
			const data = await handler(params, {
				jwt,
				signal: controller.signal,
				report,
			});
			if (controller.signal.aborted) return;

			const result: TaskResult<S> = { params, data, timestamp: Date.now() };
			await chrome.storage.local.set({ [resultKey(scope)]: result });
			await chrome.storage.local.remove(stateKey(scope));
		} catch (error) {
			if (controller.signal.aborted) return;
			console.error(`Task ${scope} failed:`, error);
			// Stop any requests still in flight for this task
			controller.abort();
			await writeState({ status: 'error', error: errorMessage(error) });
		} finally {
			if (running.get(scope) === controller) running.delete(scope);
			updateKeepAlive();
		}
	})();
}

export async function cancelTask(scope: TaskScope) {
	await ready;
	running.get(scope)?.abort();
	running.delete(scope);
	updateKeepAlive();
	await chrome.storage.local.remove(stateKey(scope));
}

export async function clearTask(scope: TaskScope) {
	await cancelTask(scope);
	await chrome.storage.local.remove(resultKey(scope));
}
