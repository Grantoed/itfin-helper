// Shared types and constants for the background service worker
export const BASE_URL = 'https://keenethics.itfin.io/api/v1';

export const STORAGE_KEYS = {
	PROJECT_INCOME: 'projectIncome',
	WORK_LOGS: 'workLogs',
	VACATIONS: 'vacations',
	REQUEST_STATE: 'requestState',
} as const;

export type ClearScope = 'all' | 'projectIncome' | 'workLogs' | 'vacations';

export interface MessageRequest {
	type: string;
	payload?: any;
}

export interface MessageResponse {
	type: string;
	success: boolean;
	data?: any;
	error?: string;
	progress?: string;
}
