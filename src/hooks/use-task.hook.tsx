import { useEffect, useReducer, useState } from 'react';
import { STALE_TASK_MS } from '../shared/constants';
import {
	INTERRUPTED_MESSAGE,
	paramsEqual,
	resultKey,
	stateKey,
	TaskMessage,
	TaskMessageResponse,
	TaskParamsMap,
	TaskResult,
	TaskScope,
	TaskState,
} from '../shared/tasks';
import { getToday } from '../utils/date.utils';
import { getStorageValue, useStorageValue } from '../utils/store.util';

const sendMessage = (message: TaskMessage) =>
	chrome.runtime.sendMessage(message) as Promise<TaskMessageResponse>;

// Inputs to show when the popup opens: those of a running task, or of a
// result fetched today. Older results fall back to fresh defaults.
const restoreParams = <S extends TaskScope>(
	scope: S
): TaskParamsMap[S] | undefined => {
	const state = getStorageValue<TaskState<S>>(stateKey(scope));
	if (state?.status === 'loading') return state.params;

	const result = getStorageValue<TaskResult<S>>(resultKey(scope));
	if (result && getToday(new Date(result.timestamp)) === getToday()) {
		return result.params;
	}
	return undefined;
};

// Whether a task is fetching or its last fetch failed, for tab indicators
export function useTaskStatus(scope: TaskScope): 'loading' | 'error' | null {
	const state = useStorageValue<TaskState<TaskScope>>(stateKey(scope));
	if (!state) return null;
	if (state.status === 'error') return 'error';
	return Date.now() - state.timestamp < STALE_TASK_MS ? 'loading' : 'error';
}

// Drives one background task: owns its input params and exposes the task's
// live state from storage.
export function useTask<S extends TaskScope>(
	scope: S,
	getDefaultParams: () => TaskParamsMap[S]
) {
	const [params, setParams] = useState<TaskParamsMap[S]>(
		() => restoreParams(scope) ?? getDefaultParams()
	);
	const [pending, setPending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);

	const state = useStorageValue<TaskState<S>>(stateKey(scope));
	const storedResult = useStorageValue<TaskResult<S>>(resultKey(scope));

	// A loading task whose heartbeat stopped died with the background worker
	// (normally the worker reports this itself when it restarts)
	const isStale =
		state?.status === 'loading' &&
		Date.now() - state.timestamp >= STALE_TASK_MS;
	const isRunning = state?.status === 'loading' && !isStale;

	// Re-render once the heartbeat would be overdue, so a worker that dies
	// while the popup is open shows up as interrupted
	const [, recheck] = useReducer((count: number) => count + 1, 0);
	const heartbeatAt = isRunning ? state.timestamp : undefined;
	useEffect(() => {
		if (heartbeatAt === undefined) return;
		const timer = setTimeout(
			recheck,
			heartbeatAt + STALE_TASK_MS - Date.now() + 100
		);
		return () => clearTimeout(timer);
	}, [heartbeatAt]);
	const loading = pending || isRunning;
	const matchesInputs = (other?: { params: TaskParamsMap[S] }) =>
		paramsEqual(other?.params, params);

	const result = matchesInputs(storedResult) ? storedResult : undefined;
	const stateError = isStale ? INTERRUPTED_MESSAGE : state?.error;
	const error =
		sendError ??
		((state?.status === 'error' || isStale) && matchesInputs(state)
			? stateError ?? null
			: null);

	const send = async (message: TaskMessage) => {
		setSendError(null);
		try {
			const response = await sendMessage(message);
			if (!response?.success) {
				setSendError(response?.error || 'Request failed. Try again.');
			}
		} catch (err) {
			console.error(`Failed to send ${message.type}:`, err);
			setSendError(
				'Could not reach the extension. Reopen the popup and try again.'
			);
		}
	};

	const start = async () => {
		if (loading) return;
		setPending(true);
		await send({ type: 'START_TASK', scope, params });
		setPending(false);
	};

	return {
		params,
		setParams,
		loading,
		progress: loading ? state?.progress ?? 'Starting…' : null,
		startedAt: isRunning ? state.startedAt : undefined,
		error,
		result,
		start,
		cancel: () => send({ type: 'CANCEL_TASK', scope }),
		clear: () => send({ type: 'CLEAR_TASK', scope }),
	};
}
