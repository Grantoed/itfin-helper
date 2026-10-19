import { useEffect, useState } from 'react';
import { apiGet } from '../shared/api';
import { CACHE_KEYS } from '../shared/constants';
import type { Team } from '../services/teams/types';
import { setStorageValue, useStorageValue } from '../utils/store.util';

export type TeamOption = { value: string; label: string };

// Teams are served from cache instantly and refreshed in the background
const useTeams = (jwt: string) => {
	const cached = useStorageValue<TeamOption[]>(CACHE_KEYS.TEAMS);
	const [refreshing, setRefreshing] = useState(true);

	useEffect(() => {
		const controller = new AbortController();
		apiGet<Team[]>('/teams/my', jwt, controller.signal)
			.then(teams =>
				setStorageValue(
					CACHE_KEYS.TEAMS,
					(teams ?? []).map(team => ({
						value: String(team.Id),
						label: team.Name,
					}))
				)
			)
			.catch(error => {
				if (!controller.signal.aborted) {
					console.error('Failed to fetch teams:', error);
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setRefreshing(false);
			});
		return () => controller.abort();
	}, [jwt]);

	return { teams: cached ?? [], loadingTeams: !cached && refreshing };
};

export default useTeams;
