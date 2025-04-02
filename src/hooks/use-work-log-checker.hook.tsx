import { useState, useEffect } from 'react';
import { format, isBefore } from 'date-fns';
import { trackingService } from '../services/tracking/tracking.service';
import { teamsService } from '../services/teams/teams.service';
import { EmployeeRecord } from '../services/tracking/types';
import { Team } from '../services/teams/types';

export interface EnhancedEmployeeRecord extends EmployeeRecord {
	isFreelancer: boolean;
}

const useWorkLogChecker = (jwt: string) => {
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

			const [trackingData, employmentType] = await Promise.all([
				trackingService.getTrackingResponse(selectedTeam, query, {
					headers: { Authorization: jwt },
				}),
				trackingService.getEmploymentType(selectedTeam, query, {
					headers: { Authorization: jwt },
				}),
			]);

			const employmentTypeMap = new Map();

			employmentType.Data.forEach(employee => {
				const isFreelancer = employee.UserType === 'freelancer';

				employmentTypeMap.set(employee.Id, isFreelancer);
			});

			const enhancedEmployees = trackingData.map((employee: EmployeeRecord) => {
				return {
					...employee,
					isFreelancer: employmentTypeMap.get(employee.Id) || false,
				};
			});

			setAllEmployees(enhancedEmployees);
			setEmployees(
				hideFreelancers
					? enhancedEmployees.filter(employee => !employee.isFreelancer)
					: enhancedEmployees
			);
		} catch (err) {
			setError('Failed to fetch work logs');
			console.error('Error fetching data:', err);
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
		hideFreelancers,
		setHideFreelancers,
	};
};

export default useWorkLogChecker;
