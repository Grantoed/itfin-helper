import { apiGet, mapWithConcurrency } from '../../../shared/api';
import type {
	CalendarEvent,
	TimeoffEvent,
} from '../../../services/vacations/types';
import type {
	TaskDataMap,
	TaskParamsMap,
	Vacation,
} from '../../../shared/tasks';
import { getMonthsInRange } from '../../../utils/date.utils';
import type { TaskContext } from '../task-runner';

const MAX_PARALLEL_MONTHS = 4;

const isTimeoff = (event: CalendarEvent): event is TimeoffEvent =>
	event.EventType === 'Vacation' || event.EventType === 'Unpaid';

export async function fetchVacations(
	{ fromDate, toDate, filterType }: TaskParamsMap['vacations'],
	{ jwt, signal, report }: TaskContext
): Promise<TaskDataMap['vacations']> {
	const months = getMonthsInRange(fromDate, toDate);
	let done = 0;
	report(`Fetching ${months.length} month${months.length > 1 ? 's' : ''}...`);

	const monthEvents = await mapWithConcurrency(
		months,
		MAX_PARALLEL_MONTHS,
		async month => {
			const events = await apiGet<CalendarEvent[]>(
				`/calendar?date=${month}&filter[type]=${encodeURIComponent(
					filterType
				)}`,
				jwt,
				signal
			);
			done++;
			report(`Fetched ${done} of ${months.length} months...`);
			return events ?? [];
		}
	);

	// A vacation spanning several months is returned once per month
	const unique = new Map<string, Vacation>();
	for (const event of monthEvents.flat()) {
		if (!isTimeoff(event)) continue;
		const start = event.StartDate.slice(0, 10);
		const end = event.EndDate.slice(0, 10);
		if (start > toDate || end < fromDate) continue;

		unique.set(`${event.RefId}-${start}-${end}`, {
			RefId: event.RefId,
			EventType: event.EventType,
			StartDate: start,
			EndDate: end,
			FirstName: event.Entity?.FirstName ?? '',
			LastName: event.Entity?.LastName ?? '',
		});
	}

	const vacations = Array.from(unique.values()).sort(
		(a, b) =>
			a.StartDate.localeCompare(b.StartDate) ||
			a.LastName.localeCompare(b.LastName)
	);

	return { vacations };
}
