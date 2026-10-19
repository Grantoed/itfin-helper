import { useState } from 'react';
import { STALE_TASK_MS } from '../shared/constants';
import {
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

	const isRunning =
		state?.status === 'loading' &&
		Date.now() - state.timestamp < STALE_TASK_MS;
	const loading = pending || isRunning;
	const matchesInputs = (other?: { params: TaskParamsMap[S] }) =>
		paramsEqual(other?.params, params);

	const result = matchesInputs(storedResult) ? storedResult : undefined;
	const error =
		sendError ??
		(state?.status === 'error' && matchesInputs(state) ? state.error : null);

	const send = async (message: TaskMessage) => {
		setSendError(null);
		try {
			const response = await sendMessage(message);
			if (!response?.success) {
				setSendError(response?.error || 'Request failed. Try again.');
			}
		} catch (err) {
			console.error(`Failed to send ${message.type}:`, err);
			setSendError('Could not reach the extension. Reopen the popup and try again.');
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
		progress: loading ? state?.progress ?? 'Starting...' : null,
		error,
		result,
		start,
		cancel: () => send({ type: 'CANCEL_TASK', scope }),
		clear: () => send({ type: 'CLEAR_TASK', scope }),
	};
}
