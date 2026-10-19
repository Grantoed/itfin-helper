import type { WorkLogDay, WorkLogEmployee } from '../shared/tasks';

export const WORKDAY_IN_MINUTES = 480;

export type WorkLogSummary = {
	employee: WorkLogEmployee;
	deficit: number;
	underworkedDays: WorkLogDay[];
};

// Employees who logged less than their expected hours, worst first.
// Vacation and unpaid days count as logged time in ITFin, so they never show
// up as gaps.
export const summarizeWorkLogs = (
	employees: WorkLogEmployee[],
	hideFreelancers: boolean
): WorkLogSummary[] =>
	employees
		.filter(employee => !hideFreelancers || !employee.isFreelancer)
		.map(employee => {
			// Results cached by older versions have no dailyMinutes
			const expected = employee.dailyMinutes || WORKDAY_IN_MINUTES;
			const workDays = employee.days.filter(
				day => !day.isWeekend && !day.isHoliday
			);
			const worked = workDays.reduce((sum, day) => sum + day.MinutesInt, 0);
			return {
				employee,
				deficit: workDays.length * expected - worked,
				underworkedDays: workDays.filter(day => day.MinutesInt < expected),
			};
		})
		.filter(summary => summary.deficit > 0)
		.sort((a, b) => b.deficit - a.deficit);

export const formatTime = (minutes: number) => {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
};
