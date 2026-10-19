// Constants shared by the popup and the background service worker
export const ITFIN_ORIGIN = 'https://keenethics.itfin.io';
export const API_BASE_URL = `${ITFIN_ORIGIN}/api/v1`;
export const JWT_COOKIE_NAME = 'itfin-jwt';

export const DEFAULT_TEAM = { id: '28', name: 'Team Delivery' } as const;

// A loading task that hasn't reported progress for this long is treated as dead
export const STALE_TASK_MS = 5 * 60 * 1000;

export const PREF_KEYS = {
	TEAM_ID: 'pref:teamId',
	HIDE_FREELANCERS: 'pref:hideFreelancers',
	VACATION_FILTER: 'pref:vacationFilter',
} as const;

export const CACHE_KEYS = {
	TEAMS: 'cache:teams',
} as const;
