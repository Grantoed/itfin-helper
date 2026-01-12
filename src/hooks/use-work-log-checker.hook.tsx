import { useState, useEffect } from 'react';
import { format, isBefore } from 'date-fns';
import { teamsService } from '../services/teams/teams.service';
import { EmployeeRecord } from '../services/tracking/types';
import { Team } from '../services/teams/types';
import { MessageService } from '../utils/message-service.util';

export interface EnhancedEmployeeRecord extends EmployeeRecord {
	isFreelancer: boolean;
}

const useWorkLogChecker = (jwt: string) => {
	const STALE_REQUEST_MS = 5 * 60 * 1000;
	const [fromDate, setFromDate] = useState<string>(
		format(new Date(), 'yyyy-MM-01')
	);
	const [toDate, setToDate] = useState<string>(
		format(new Date(), 'yyyy-MM-dd')
	);
	const [employees, setEmployees] = useState<EnhancedEmployeeRecord[]>([]);
	const [allEmployees, setAllEmployees] = useState<EnhancedEmployeeRecord[]>(
		[]
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [fetched, setFetched] = useState<boolean>(false);
	const [hideFreelancers, setHideFreelancers] = useState<boolean>(false);

	const [teams, setTeams] = useState<Team[]>([]);
	const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
	const [selectedTeam, setSelectedTeam] = useState<string>('28');

	// Load cached data on mount and when params change
	useEffect(() => {
		const loadCachedData = async () => {
			try {
				const cachedData = await MessageService.getCachedData();

				// Check for in-progress request (and clear stale ones)
				const state = cachedData.requestState;
				if (state && state.type === 'WORK_LOGS' && state.loading) {
					const isMissingTimestamp = !state.timestamp;
					const isStale =
						state.timestamp && Date.now() - state.timestamp > STALE_REQUEST_MS;
					if (isStale || isMissingTimestamp) {
						await MessageService.sendMessage('CLEAR_REQUEST_STATE');
						setLoading(false);
					} else {
						setLoading(true);
					}
				}

				if (cachedData.workLogs) {
					const cached = cachedData.workLogs;
					// Use cached data if dates and team match (independent of hideFreelancers).
					if (
						cached.fromDate === fromDate &&
						cached.toDate === toDate &&
						cached.teamId === selectedTeam &&
						cached.employees
					) {
						setAllEmployees(cached.employees);
						setFetched(true);
					} else {
						// Clear data if params don't match
						setAllEmployees([]);
						setEmployees([]);
						setFetched(false);
					}
				}
			} catch (err) {
				console.error('Failed to load cached data:', err);
			}
		};

		loadCachedData();
	}, [fromDate, toDate, selectedTeam, hideFreelancers]);

	// Listen for messages from background script
	useEffect(() => {
		const unsubscribeSuccess = MessageService.onMessage(
			'WORK_LOGS_SUCCESS',
			response => {
				if (response.data) {
					const enhancedEmployees = response.data.employees;
					setAllEmployees(enhancedEmployees);
					// Don't filter here - let the separate useEffect handle filtering
					// based on current hideFreelancers state
					setFetched(true);
					setLoading(false);
				}
			}
		);

		const unsubscribeError = MessageService.onMessage(
			'WORK_LOGS_ERROR',
			response => {
				setError(response.error || 'Failed to fetch work logs');
				setLoading(false);
			}
		);

		const unsubscribeCancelled = MessageService.onMessage(
			'WORK_LOGS_CANCELLED',
			() => {
				setLoading(false);
				setError(null);
			}
		);

		return () => {
			unsubscribeSuccess();
			unsubscribeError();
			unsubscribeCancelled();
		};
	}, []);

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

	useEffect(() => {
		if (hideFreelancers) {
			setEmployees(allEmployees.filter(employee => !employee.isFreelancer));
		} else {
			setEmployees(allEmployees);
		}
	}, [hideFreelancers, allEmployees]);

	const fetchWorkLogs = async () => {
		if (loading) return;
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
			await MessageService.sendMessage('FETCH_WORK_LOGS', {
				jwt,
				teamId: selectedTeam,
				fromDate,
				toDate,
				hideFreelancers,
			});
		} catch (err) {
			setError('Failed to initiate request');
			console.error('Error sending request:', err);
			setLoading(false);
		}
	};

	const resetWorkLogs = async () => {
		try {
			setLoading(false);
			setError(null);
			setFetched(false);
			setAllEmployees([]);
			setEmployees([]);
			await MessageService.sendMessage('CLEAR_ALL_DATA', { scope: 'workLogs' });
			setLoading(false);
		} catch (err) {
			console.error('Failed to reset work logs state:', err);
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
		resetWorkLogs,
		setFromDate,
		setToDate,
		teams,
		loadingTeams,
		selectedTeam,
		setSelectedTeam,
		hideFreelancers,
		setHideFreelancers,
	};
};

export default useWorkLogChecker;
