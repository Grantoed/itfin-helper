import { ApiError, getJwt, isAuthError } from '../../shared/api';
import { CACHE_KEYS } from '../../shared/constants';
import {
	INTERRUPTED_MESSAGE,
	resultKey,
	stateKey,
	TASK_SCOPES,
	TaskDataMap,
	TaskParamsMap,
	TaskResult,
	TaskScope,
	TaskState,
} from '../../shared/tasks';
import { badgeTaskEnded, badgeTaskStarted } from './badge';
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

type RunningTask = { controller: AbortController; heartbeat: () => void };

const running = new Map<TaskScope, RunningTask>();

// Any task still marked as loading when the service worker boots was killed
// together with the previous worker, so it can never finish. Turn it into an
// error so the popup says what happened instead of spinning forever.
const ready = (async () => {
	const keys = TASK_SCOPES.map(stateKey);
	const states: Record<string, TaskState<TaskScope> | undefined> =
		await chrome.storage.local.get(keys);
	const interrupted: Record<string, TaskState<TaskScope>> = {};
	for (const key of keys) {
		const state = states[key];
		if (state?.status === 'loading') {
			interrupted[key] = {
				...state,
				status: 'error',
				progress: undefined,
				error: INTERRUPTED_MESSAGE,
				timestamp: Date.now(),
			};
		}
	}
	if (Object.keys(interrupted).length) {
		await chrome.storage.local.set(interrupted);
	}
})().catch(error =>
	console.error('Failed to recover interrupted tasks:', error)
);

// MV3 service workers are stopped after ~30s without extension API activity,
// and in-flight fetches alone don't count. ITFin can take minutes to answer,
// so while tasks run, refresh each task's state every few seconds. The
// storage write keeps the worker alive and tells the popup the task is still
// alive (see STALE_TASK_MS).
const HEARTBEAT_MS = 15_000;
let keepAliveTimer: ReturnType<typeof setInterval> | undefined;
const updateKeepAlive = () => {
	if (running.size && !keepAliveTimer) {
		keepAliveTimer = setInterval(
			() => running.forEach(task => task.heartbeat()),
			HEARTBEAT_MS
		);
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
	const startedAt = Date.now();
	let lastProgress = 'Starting…';

	const writeState = (
		state: Omit<TaskState<S>, 'params' | 'timestamp' | 'startedAt'>
	) =>
		chrome.storage.local.set({
			[stateKey(scope)]: { ...state, params, startedAt, timestamp: Date.now() },
		});

	const report = (progress: string) => {
		if (controller.signal.aborted || progress === lastProgress) return;
		lastProgress = progress;
		writeState({ status: 'loading', progress });
	};

	const heartbeat = () => {
		if (!controller.signal.aborted) {
			writeState({ status: 'loading', progress: lastProgress });
		}
	};

	running.set(scope, { controller, heartbeat });
	updateKeepAlive();
	void badgeTaskStarted(scope, running.size);

	await writeState({ status: 'loading', progress: lastProgress });

	void (async () => {
		let outcome: 'done' | 'error' | null = null;
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
			await chrome.storage.local.set({
				[resultKey(scope)]: result,
				[CACHE_KEYS.SESSION_EXPIRED]: false,
			});
			await chrome.storage.local.remove(stateKey(scope));
			outcome = 'done';
		} catch (error) {
			if (controller.signal.aborted) return;
			console.error(`Task ${scope} failed:`, error);
			// Stop any requests still in flight for this task
			controller.abort();
			await writeState({ status: 'error', error: errorMessage(error) });
			if (isAuthError(error)) {
				await chrome.storage.local.set({ [CACHE_KEYS.SESSION_EXPIRED]: true });
			}
			outcome = 'error';
		} finally {
			if (running.get(scope)?.controller === controller) running.delete(scope);
			updateKeepAlive();
			void badgeTaskEnded(scope, running.size, outcome);
		}
	})();
}

export async function cancelTask(scope: TaskScope) {
	await ready;
	running.get(scope)?.controller.abort();
	running.delete(scope);
	updateKeepAlive();
	void badgeTaskEnded(scope, running.size, null);
	await chrome.storage.local.remove(stateKey(scope));
}

export async function clearTask(scope: TaskScope) {
	await cancelTask(scope);
	await chrome.storage.local.remove(resultKey(scope));
}
