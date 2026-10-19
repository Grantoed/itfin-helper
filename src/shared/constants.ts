// Constants shared by the popup and the background service worker
export const ITFIN_ORIGIN = 'https://keenethics.itfin.io';
export const API_BASE_URL = `${ITFIN_ORIGIN}/api/v1`;
export const JWT_COOKIE_NAME = 'itfin-jwt';

export const DEFAULT_TEAM = { id: '28', name: 'Team Delivery' } as const;

// A loading task whose heartbeat (every 15s) stopped this long ago is dead
export const STALE_TASK_MS = 60 * 1000;

export const PREF_KEYS = {
	TEAM_ID: 'pref:teamId',
	HIDE_FREELANCERS: 'pref:hideFreelancers',
	VACATION_FILTER: 'pref:vacationFilter',
	ACTIVE_TAB: 'pref:activeTab',
	THEME: 'pref:theme',
	MARKDOWN_WORK_LOGS: 'pref:markdown:workLogs',
	MARKDOWN_VACATIONS: 'pref:markdown:vacations',
	// Suffixed with the month, e.g. 'pref:plannedIncome:2026-10'
	PLANNED_INCOME: 'pref:plannedIncome',
} as const;

export const CACHE_KEYS = {
	TEAMS: 'cache:teams',
	HOLIDAYS: 'cache:holidays',
	// true after ITFin rejected the session; cleared by the next accepted request
	SESSION_EXPIRED: 'session:expired',
} as const;
