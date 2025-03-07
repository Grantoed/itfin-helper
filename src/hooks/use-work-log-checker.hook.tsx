import { useState, useEffect } from 'react';
import { format, isBefore } from 'date-fns';
import { trackingService } from '../services/tracking/tracking.service';
import { teamsService } from '../services/teams/teams.service';
import { EmployeeRecord } from '../services/tracking/types';
import { Team } from '../services/teams/types';

const useWorkLogChecker = (jwt: string) => {
	const [fromDate, setFromDate] = useState<string>(
		format(new Date(), 'yyyy-MM-01')
	);
	const [toDate, setToDate] = useState<string>(
		format(new Date(), 'yyyy-MM-dd')
	);
	const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [fetched, setFetched] = useState<boolean>(false);

	const [teams, setTeams] = useState<Team[]>([]);
	const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
	const [selectedTeam, setSelectedTeam] = useState<string>('28'); // Default to Team Delivery (id: 28)

	useEffect(() => {
		const fetchTeams = async () => {
			if (!jwt) return;

			setLoadingTeams(true);
			try {
				const userTeams = await teamsService.getMyTeamsResponse({
					headers: { Authorization: jwt },
				});
				setTeams(userTeams);
			} catch (err) {
				console.error('Failed to fetch teams:', err);
			} finally {
				setLoadingTeams(false);
			}
		};

		fetchTeams();
	}, [jwt]);

	const fetchWorkLogs = async () => {
		if (!isBefore(new Date(fromDate), new Date(toDate))) {
			setError('Start date must be before end date');
			return;
		}

		if (!selectedTeam) {
			setError('Please select a team');
			return;
		}

		setLoading(true);
		setError(null);
		setFetched(true);
		try {
			const query = {
				'filter[from]': fromDate,
				'filter[to]': toDate,
			};

			const data = await trackingService.getTrackingResponse(
				selectedTeam,
				query,
				{
					headers: { Authorization: jwt },
				}
			);

			setEmployees(data as EmployeeRecord[]);
		} catch (err) {
			setError('Failed to fetch work logs');
		} finally {
			setLoading(false);
		}
	};

	return {
		fromDate,
		toDate,
		employees,
		loading,
		error,
		fetched,
		fetchWorkLogs,
		setFromDate,
		setToDate,
		teams,
		loadingTeams,
		selectedTeam,
		setSelectedTeam,
	};
};

export default useWorkLogChecker;
