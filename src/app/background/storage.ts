import { ClearScope, STORAGE_KEYS } from './constants';

export async function clearStoredData(scope: ClearScope) {
	const removals: string[] = [];
	const resets: Record<string, any> = {};

	if (scope === 'all' || scope === 'projectIncome') {
		removals.push(STORAGE_KEYS.PROJECT_INCOME);
	}
	if (scope === 'all' || scope === 'workLogs') {
		removals.push(STORAGE_KEYS.WORK_LOGS);
	}
	if (scope === 'all' || scope === 'vacations') {
		removals.push(STORAGE_KEYS.VACATIONS);
	}

	// Always clear request state
	resets[STORAGE_KEYS.REQUEST_STATE] = null;

	if (removals.length > 0) {
		await chrome.storage.local.remove(removals);
	}

	await chrome.storage.local.set(resets);
}

export const setRequestState = async (state: any) =>
	chrome.storage.local.set({ [STORAGE_KEYS.REQUEST_STATE]: state });

export const clearRequestState = async () => setRequestState(null);

export const cacheData = async (key: string, data: any) =>
	chrome.storage.local.set({ [key]: data });

export const getCachedData = async () =>
	chrome.storage.local.get([
		STORAGE_KEYS.PROJECT_INCOME,
		STORAGE_KEYS.WORK_LOGS,
		STORAGE_KEYS.VACATIONS,
		STORAGE_KEYS.REQUEST_STATE,
	]);
