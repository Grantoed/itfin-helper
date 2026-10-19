import { apiGet, mapWithConcurrency } from '../../../shared/api';
import type {
	CalendarEvent,
	TimeoffEvent,
} from '../../../services/vacations/types';
import type {
	Holiday,
	TaskDataMap,
	TaskParamsMap,
	Vacation,
} from '../../../shared/tasks';
import {
	addDays,
	getMonthsInRange,
	parseISODate,
	toISODate,
} from '../../../utils/date.utils';
import type { TaskContext } from '../task-runner';

const MAX_PARALLEL_MONTHS = 4;

const isTimeoff = (event: CalendarEvent): event is TimeoffEvent =>
	event.EventType === 'Vacation' || event.EventType === 'Unpaid';

const shiftMonth = (month: string, months: number) => {
	const shifted = parseISODate(month);
	shifted.setMonth(shifted.getMonth() + months);
	return toISODate(shifted);
};

const lastDayOfMonth = (month: string) => addDays(shiftMonth(month, 1), -1);

const toVacation = (event: TimeoffEvent): Vacation => ({
	RefId: event.RefId,
	EmployeeId: event.Entity?.Id ?? event.RefId,
	EventType: event.EventType,
	StartDate: event.StartDate.slice(0, 10),
	EndDate: event.EndDate.slice(0, 10),
	FirstName: event.Entity?.FirstName ?? '',
	LastName: event.Entity?.LastName ?? '',
});

// ITFin stores time off that crosses a month boundary as one record per
// month (with different ids), e.g. Sep 28-30 and Oct 1-3. Join back-to-back
// records of the same person and type into one vacation.
export const mergeAdjacent = (vacations: Vacation[]): Vacation[] => {
	const sorted = [...vacations].sort(
		(a, b) =>
			a.EmployeeId - b.EmployeeId ||
			a.EventType.localeCompare(b.EventType) ||
			a.StartDate.localeCompare(b.StartDate)
	);
	const merged: Vacation[] = [];
	for (const vacation of sorted) {
		const previous = merged[merged.length - 1];
		if (
			previous &&
			previous.EmployeeId === vacation.EmployeeId &&
			previous.EventType === vacation.EventType &&
			addDays(previous.EndDate, 1) >= vacation.StartDate
		) {
			if (vacation.EndDate > previous.EndDate) {
				merged[merged.length - 1] = { ...previous, EndDate: vacation.EndDate };
			}
		} else {
			merged.push(vacation);
		}
	}
	return merged;
};

export async function fetchVacations(
	{ fromDate, toDate, filterType }: TaskParamsMap['vacations'],
	{ jwt, signal, report }: TaskContext
): Promise<TaskDataMap['vacations']> {
	const holidays = new Map<string, Holiday>();
	const fetchMonth = async (month: string) => {
		const events =
			(await apiGet<CalendarEvent[]>(
				`/calendar?date=${month}&filter[type]=${encodeURIComponent(
					filterType
				)}`,
				jwt,
				signal
			)) ?? [];
		for (const event of events) {
			if (event.EventType !== 'Holiday') continue;
			const date = event.Date.slice(0, 10);
			holidays.set(date, { Date: date, Name: event.Name });
		}
		return events.filter(isTimeoff).map(toVacation);
	};

	const months = getMonthsInRange(fromDate, toDate);
	let done = 0;
	report(`Fetching ${months.length} month${months.length > 1 ? 's' : ''}…`);

	const vacations = (
		await mapWithConcurrency(months, MAX_PARALLEL_MONTHS, async month => {
			const result = await fetchMonth(month);
			report(`Fetched ${++done} of ${months.length} months…`);
			return result;
		})
	).flat();

	// A vacation touching the first or last fetched month's edge may continue
	// into the neighbouring month; fetch it so the full vacation is shown.
	const firstMonth = months[0];
	const lastMonth = months[months.length - 1];
	const edgeMonths = [
		vacations.some(v => v.StartDate === firstMonth) &&
			shiftMonth(firstMonth, -1),
		vacations.some(v => v.EndDate === lastDayOfMonth(lastMonth)) &&
			shiftMonth(lastMonth, 1),
	].filter((month): month is string => Boolean(month));
	if (edgeMonths.length) {
		report('Checking vacations that span neighbouring months…');
		const neighbours = await Promise.all(edgeMonths.map(fetchMonth));
		vacations.push(...neighbours.flat());
	}

	// The same record can come back from more than one request
	const unique = new Map<string, Vacation>();
	for (const vacation of vacations) {
		unique.set(
			`${vacation.RefId}-${vacation.StartDate}-${vacation.EndDate}`,
			vacation
		);
	}

	const result = mergeAdjacent(Array.from(unique.values()))
		.filter(v => v.StartDate <= toDate && v.EndDate >= fromDate)
		.sort(
			(a, b) =>
				a.StartDate.localeCompare(b.StartDate) ||
				a.LastName.localeCompare(b.LastName)
		);

	return {
		vacations: result,
		holidays: Array.from(holidays.values())
			.filter(holiday => holiday.Date >= fromDate && holiday.Date <= toDate)
			.sort((a, b) => a.Date.localeCompare(b.Date)),
	};
}
