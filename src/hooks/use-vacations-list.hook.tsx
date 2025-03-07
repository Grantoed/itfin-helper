import { useState } from 'react';
import { vacationService } from '../services/vacations/vacations.service';
import {
	CalendarEvent,
	TimeoffEvent,
	FilterType,
} from '../services/vacations/types';

// Helper to check if an event is a time off event
const isTimeoffEvent = (event: CalendarEvent): event is TimeoffEvent => {
	return event.EventType === 'Vacation' || event.EventType === 'Unpaid';
};

const useVacationChecker = (jwt: string) => {
	const [fromDate, setFromDate] = useState<string>(() => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}-01`;
	});

	const [toDate, setToDate] = useState<string>(() => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	});

	const [vacations, setVacations] = useState<CalendarEvent[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [fetched, setFetched] = useState<boolean>(false);
	const [filterType, setFilterType] = useState<FilterType>('company');

	const fetchVacations = async () => {
		if (new Date(fromDate) >= new Date(toDate)) {
			setError('Start date must be before end date');
			return;
		}

		setLoading(true);
		setError(null);
		setFetched(true);

		try {
			// We need to fetch data for each month in the date range
			const months = getMonthsInRange(fromDate, toDate);
			let allEvents: CalendarEvent[] = [];

			// Make requests for each month
			for (const monthDate of months) {
				const query = {
					date: monthDate,
					'filter[type]': filterType,
				};

				const monthEvents = await vacationService.getVacationsResponse(query, {
					headers: { Authorization: jwt },
				});
				allEvents = [...allEvents, ...monthEvents];
			}

			// Filter events to only include those within the date range
			const filteredEvents = allEvents.filter(event => {
				if (!isTimeoffEvent(event)) return false;

				const eventStartDate = new Date(event.StartDate);
				const eventEndDate = new Date(event.EndDate);
				const rangeStart = new Date(fromDate);
				const rangeEnd = new Date(toDate);

				// Check if dates overlap
				return (
					(eventStartDate <= rangeEnd && eventEndDate >= rangeStart) ||
					(eventStartDate >= rangeStart && eventStartDate <= rangeEnd) ||
					(eventEndDate >= rangeStart && eventEndDate <= rangeEnd)
				);
			});

			// Remove duplicates (events might appear in multiple months)
			const uniqueEvents = removeDuplicates(filteredEvents);
			setVacations(uniqueEvents);
		} catch (err) {
			setError('Failed to fetch vacation data');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	// Get first day of each month in the date range
	const getMonthsInRange = (start: string, end: string): string[] => {
		const startDate = new Date(start);
		const endDate = new Date(end);
		const months: string[] = [];

		const currentDate = new Date(startDate);
		currentDate.setDate(1); // Set to first day of the month

		while (currentDate <= endDate) {
			const year = currentDate.getFullYear();
			const month = String(currentDate.getMonth() + 1).padStart(2, '0');
			const day = '01';

			months.push(`${year}-${month}-${day}`);

			// Move to next month
			currentDate.setMonth(currentDate.getMonth() + 1);
		}

		return months;
	};

	// Remove duplicate events by RefId and Date
	const removeDuplicates = (events: CalendarEvent[]): CalendarEvent[] => {
		const uniqueMap = new Map();

		events.forEach(event => {
			if (isTimeoffEvent(event)) {
				const key = `${event.RefId}-${event.StartDate}-${event.EndDate}`;
				uniqueMap.set(key, event);
			}
		});

		return Array.from(uniqueMap.values());
	};

	return {
		fromDate,
		toDate,
		vacations: vacations.filter(isTimeoffEvent),
		loading,
		error,
		fetched,
		filterType,
		fetchVacations,
		setFromDate,
		setToDate,
		setFilterType,
	};
};

export default useVacationChecker;
