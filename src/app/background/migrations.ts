import { PREF_KEYS } from '../../shared/constants';

// Keys written by earlier versions of the extension
const LEGACY_KEYS = [
	'projectIncome',
	'workLogs',
	'vacations',
	'requestState',
	'authToken',
	'workLogLastSelectedTeamId',
];

export async function migrateLegacyStorage() {
	const legacy: Record<string, any> = await chrome.storage.local.get(
		LEGACY_KEYS
	);
	if (!Object.keys(legacy).length) return;

	const teamId = legacy.workLogLastSelectedTeamId ?? legacy.workLogs?.teamId;
	if (teamId) {
		const current = await chrome.storage.local.get(PREF_KEYS.TEAM_ID);
		if (!current[PREF_KEYS.TEAM_ID]) {
			await chrome.storage.local.set({ [PREF_KEYS.TEAM_ID]: String(teamId) });
		}
	}

	await chrome.storage.local.remove(LEGACY_KEYS);
}
