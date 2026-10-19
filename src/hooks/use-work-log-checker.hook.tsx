import { useMemo } from 'react';
import { DEFAULT_TEAM, PREF_KEYS } from '../shared/constants';
import { getFirstDayOfMonth, getToday } from '../utils/date.utils';
import {
	getStorageValue,
	setStorageValue,
	usePersistentState,
} from '../utils/store.util';
import { summarizeWorkLogs } from '../utils/work-log.utils';
import { useTask } from './use-task.hook';
import useTeams, { TeamOption } from './use-teams.hook';

const useWorkLogChecker = (jwt: string) => {
	const task = useTask('workLogs', () => ({
		fromDate: getFirstDayOfMonth(),
		toDate: getToday(),
		teamId: getStorageValue<string>(PREF_KEYS.TEAM_ID) ?? DEFAULT_TEAM.id,
	}));
	const [hideFreelancers, setHideFreelancers] = usePersistentState(
		PREF_KEYS.HIDE_FREELANCERS,
		false
	);
	const { teams, loadingTeams } = useTeams(jwt);

	const teamOptions = useMemo<TeamOption[]>(() => {
		const options: TeamOption[] = [
			{ value: DEFAULT_TEAM.id, label: DEFAULT_TEAM.name },
		];
		for (const team of teams) {
			if (team.value !== DEFAULT_TEAM.id) options.push(team);
		}
		return options;
	}, [teams]);

	const setSelectedTeam = (teamId: string) => {
		task.setParams(params => ({ ...params, teamId }));
		setStorageValue(PREF_KEYS.TEAM_ID, teamId);
	};

	const employees = task.result?.data.employees;
	const summaries = useMemo(
		() => (employees ? summarizeWorkLogs(employees, hideFreelancers) : null),
		[employees, hideFreelancers]
	);

	return {
		...task,
		teamOptions,
		loadingTeams,
		setSelectedTeam,
		hideFreelancers,
		setHideFreelancers,
		summaries,
	};
};

export default useWorkLogChecker;
