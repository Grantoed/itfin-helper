import { useEffect } from 'react';
import { apiGet } from '../shared/api';
import { CACHE_KEYS } from '../shared/constants';
import type { CalendarEvent } from '../services/vacations/types';
import { getFirstDayOfMonth, getToday } from '../utils/date.utils';
import { setStorageValue, useStorageValue } from '../utils/store.util';

type CachedHolidays = { month: string; dates: string[]; fetchedOn: string };

// Public holidays ('YYYY-MM-DD') in the current month from the company
// calendar. Served from a per-day cache; undefined until first loaded.
const useHolidays = (jwt: string): string[] | undefined => {
	const month = getFirstDayOfMonth();
	const cached = useStorageValue<CachedHolidays>(CACHE_KEYS.HOLIDAYS);
	const isFresh = cached?.month === month && cached.fetchedOn === getToday();

	useEffect(() => {
		if (isFresh) return;
		const controller = new AbortController();
		apiGet<CalendarEvent[]>(
			`/calendar?date=${month}&filter[type]=company`,
			jwt,
			controller.signal
		)
			.then(events =>
				setStorageValue(CACHE_KEYS.HOLIDAYS, {
					month,
					fetchedOn: getToday(),
					dates: (events ?? [])
						.filter(event => event.EventType === 'Holiday')
						.map(event => event.Date.slice(0, 10)),
				})
			)
			.catch(error => {
				if (!controller.signal.aborted) {
					console.error('Failed to fetch holidays:', error);
				}
			});
		return () => controller.abort();
	}, [jwt, month, isFresh]);

	return cached?.month === month ? cached.dates : undefined;
};

export default useHolidays;
