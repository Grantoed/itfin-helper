// Contract between the popup and the background service worker.
//
// The popup starts/cancels tasks via runtime messages. The background owns all
// task state and writes it to chrome.storage.local; the popup renders straight
// from storage (see utils/store.util.ts). Storage is the single source of
// truth, so closing and reopening the popup never loses progress or results.
import type { FilterType } from '../services/vacations/types';

export type TaskScope = 'projectIncome' | 'workLogs' | 'vacations';

export type DateRange = { fromDate: string; toDate: string };

export interface TaskParamsMap {
	projectIncome: DateRange;
	workLogs: DateRange & { teamId: string };
	vacations: DateRange & { filterType: FilterType };
}

export type WorkLogDay = {
	Date: string;
	isWeekend: boolean;
	isHoliday: boolean;
	MinutesInt: number;
};

export type WorkLogEmployee = {
	Id: number;
	FirstName: string;
	LastName: string;
	isFreelancer: boolean;
	// Expected minutes per working day (from the employee's BusinessHours)
	dailyMinutes: number;
	// Only days within the employee's employment period
	days: WorkLogDay[];
};

export type Vacation = {
	RefId: number;
	EmployeeId: number;
	EventType: 'Vacation' | 'Unpaid';
	StartDate: string;
	EndDate: string;
	FirstName: string;
	LastName: string;
};

export type Holiday = { Date: string; Name: string };

export interface TaskDataMap {
	projectIncome: { income: number; projectCount: number };
	workLogs: { employees: WorkLogEmployee[] };
	vacations: {
		vacations: Vacation[];
		// Missing in results cached by older versions
		holidays?: Holiday[];
	};
}

export type TaskResult<S extends TaskScope> = {
	params: TaskParamsMap[S];
	data: TaskDataMap[S];
	timestamp: number;
};

export type TaskState<S extends TaskScope> = {
	status: 'loading' | 'error';
	params: TaskParamsMap[S];
	progress?: string;
	error?: string;
	startedAt: number;
	// Refreshed by a heartbeat while the task runs
	timestamp: number;
};

export const INTERRUPTED_MESSAGE =
	'Interrupted: Chrome stopped the background worker before ITFin answered. Try again.';

export const resultKey = (scope: TaskScope) => `result:${scope}`;
export const stateKey = (scope: TaskScope) => `task:${scope}`;

export const TASK_SCOPES: TaskScope[] = [
	'projectIncome',
	'workLogs',
	'vacations',
];

export type TaskMessage =
	| { type: 'START_TASK'; scope: TaskScope; params: TaskParamsMap[TaskScope] }
	| { type: 'CANCEL_TASK'; scope: TaskScope }
	| { type: 'CLEAR_TASK'; scope: TaskScope }
	| { type: 'PING' };

export type TaskMessageResponse = { success: boolean; error?: string };

export const paramsEqual = (a: object | undefined, b: object | undefined) => {
	if (!a || !b) return false;
	const keysA = Object.keys(a) as (keyof typeof a)[];
	return (
		keysA.length === Object.keys(b).length &&
		keysA.every(key => a[key] === (b as typeof a)[key])
	);
};
