import { STORAGE_KEYS } from '../constants';
import { broadcastToPopup } from '../messaging';
import { makeRequest } from '../request-utils';
import {
	clearController,
	hasActiveController,
	setController,
} from '../controllers';
import { cacheData, clearRequestState, setRequestState } from '../storage';

const SCOPE = 'vacations';

export async function handleVacationsRequest(
	jwt: string,
	fromDate: string,
	toDate: string,
	filterType: string
) {
	// If already running, do not start a duplicate
	if (hasActiveController(SCOPE)) {
		await broadcastToPopup({
			type: 'VACATIONS_PROGRESS',
			success: true,
			progress: 'A request is already in progress...',
		});
		return;
	}

	const controller = new AbortController();
	const signal = controller.signal;
	setController(SCOPE, controller);

	try {
		await setRequestState({
			type: 'VACATIONS',
			loading: true,
			progress: 'Fetching vacations...',
			timestamp: Date.now(),
		});
		const months = getMonthsInRange(fromDate, toDate);
		let allEvents: any[] = [];

		for (const monthDate of months) {
			const monthEvents = await makeRequest<any[]>(
				`/calendar?date=${encodeURIComponent(
					monthDate
				)}&filter[type]=${encodeURIComponent(filterType)}`,
				jwt,
				signal
			);
			allEvents = [...allEvents, ...monthEvents];
		}

		const filteredEvents = allEvents.filter(event => {
			if (event.EventType !== 'Vacation' && event.EventType !== 'Unpaid') {
				return false;
			}

			const eventStartDate = new Date(event.StartDate);
			const eventEndDate = new Date(event.EndDate);
			const rangeStart = new Date(fromDate);
			const rangeEnd = new Date(toDate);

			return (
				(eventStartDate <= rangeEnd && eventEndDate >= rangeStart) ||
				(eventStartDate >= rangeStart && eventStartDate <= rangeEnd) ||
				(eventEndDate >= rangeStart && eventEndDate <= rangeEnd)
			);
		});

		const uniqueEvents = removeDuplicates(filteredEvents);

		const result = {
			vacations: uniqueEvents,
			fromDate,
			toDate,
			filterType,
			timestamp: Date.now(),
		};

		await cacheData(STORAGE_KEYS.VACATIONS, result);
		await clearRequestState();

		await broadcastToPopup({
			type: 'VACATIONS_SUCCESS',
			success: true,
			data: result,
		});
	} catch (error: any) {
		if (error.name === 'AbortError') {
			await clearRequestState();
			await broadcastToPopup({
				type: 'VACATIONS_CANCELLED',
				success: false,
				error: 'Request cancelled',
			});
		} else {
			console.error('Failed to fetch vacations:', error);
			await clearRequestState();
			await broadcastToPopup({
				type: 'VACATIONS_ERROR',
				success: false,
				error: 'Failed to fetch vacation data',
			});
		}
	} finally {
		clearController(SCOPE);
	}
}

function getMonthsInRange(start: string, end: string): string[] {
	const startDate = new Date(start);
	const endDate = new Date(end);
	const months: string[] = [];

	const currentDate = new Date(startDate);
	currentDate.setDate(1);

	while (currentDate <= endDate) {
		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, '0');
		const day = '01';
		months.push(`${year}-${month}-${day}`);
		currentDate.setMonth(currentDate.getMonth() + 1);
	}

	return months;
}

function removeDuplicates(events: any[]): any[] {
	const uniqueMap = new Map();
	events.forEach(event => {
		if (event.EventType === 'Vacation' || event.EventType === 'Unpaid') {
			const key = `${event.RefId}-${event.StartDate}-${event.EndDate}`;
			uniqueMap.set(key, event);
		}
	});
	return Array.from(uniqueMap.values());
}
