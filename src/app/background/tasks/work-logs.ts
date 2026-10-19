import { apiGet } from '../../../shared/api';
import type {
	EmployeeRecord,
	EmploymentType,
} from '../../../services/tracking/types';
import type { TaskDataMap, TaskParamsMap } from '../../../shared/tasks';
import type { TaskContext } from '../task-runner';

export async function fetchWorkLogs(
	{ fromDate, toDate, teamId }: TaskParamsMap['workLogs'],
	{ jwt, signal, report }: TaskContext
): Promise<TaskDataMap['workLogs']> {
	const query = `filter[from]=${encodeURIComponent(
		fromDate
	)}&filter[to]=${encodeURIComponent(toDate)}`;
	const team = encodeURIComponent(teamId);

	report('Fetching work logs...');

	const [tracking, agreements] = await Promise.all([
		apiGet<EmployeeRecord[]>(`/teams/${team}/tracking?${query}`, jwt, signal),
		apiGet<EmploymentType>(`/teams/${team}/agreements?${query}`, jwt, signal),
	]);

	const freelancers = new Set(
		(agreements?.Data ?? [])
			.filter(employee => employee.UserType === 'freelancer')
			.map(employee => employee.Id)
	);

	// Keep only the fields the popup renders; this keeps storage reads fast
	const employees = (tracking ?? []).map(employee => ({
		Id: employee.Id,
		FirstName: employee.FirstName,
		LastName: employee.LastName,
		isFreelancer: freelancers.has(employee.Id),
		days: (employee.Log?.Data ?? []).map(day => ({
			Date: day.Date,
			isWeekend: day.isWeekend,
			isHoliday: day.isHoliday,
			MinutesInt: day.MinutesInt || 0,
		})),
	}));

	return { employees };
}
