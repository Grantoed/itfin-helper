import { useState, useEffect } from 'react';
import {
	CalendarEvent,
	TimeoffEvent,
	FilterType,
} from '../services/vacations/types';
import { MessageService } from '../utils/message-service.util';

const isTimeoffEvent = (event: CalendarEvent): event is TimeoffEvent => {
	return event.EventType === 'Vacation' || event.EventType === 'Unpaid';
};

const useVacationChecker = (jwt: string) => {
	const STALE_REQUEST_MS = 5 * 60 * 1000;
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

	// Load cached data on mount and when params change
	useEffect(() => {
		const loadCachedData = async () => {
			try {
				const cachedData = await MessageService.getCachedData();

				// Check for in-progress request (and clear stale ones)
				const state = cachedData.requestState;
				if (state && state.type === 'VACATIONS' && state.loading) {
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

				if (cachedData.vacations) {
					const cached = cachedData.vacations;
					// Only use cached data if dates and filterType match
					if (
						cached.fromDate === fromDate &&
						cached.toDate === toDate &&
						cached.filterType === filterType &&
						cached.vacations
					) {
						setVacations(cached.vacations.filter(isTimeoffEvent));
						setFetched(true);
					} else {
						// Clear data if params don't match
						setVacations([]);
						setFetched(false);
					}
				}
			} catch (err) {
				console.error('Failed to load cached data:', err);
			}
		};

		loadCachedData();
	}, [fromDate, toDate, filterType]);

	// Listen for messages from background script
	useEffect(() => {
		const unsubscribeSuccess = MessageService.onMessage(
			'VACATIONS_SUCCESS',
			response => {
				if (response.data) {
					setVacations(response.data.vacations.filter(isTimeoffEvent));
					setFetched(true);
					setLoading(false);
				}
			}
		);

		const unsubscribeError = MessageService.onMessage(
			'VACATIONS_ERROR',
			response => {
				setError(response.error || 'Failed to fetch vacation data');
				setLoading(false);
			}
		);

		const unsubscribeCancelled = MessageService.onMessage(
			'VACATIONS_CANCELLED',
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

	const fetchVacations = async () => {
		if (loading) return;
		if (new Date(fromDate) >= new Date(toDate)) {
			setError('Start date must be before end date');
			return;
		}

		setLoading(true);
		setError(null);
		setFetched(true);

		try {
			await MessageService.sendMessage('FETCH_VACATIONS', {
				jwt,
				fromDate,
				toDate,
				filterType,
			});
		} catch (err) {
			setError('Failed to initiate request');
			console.error('Error sending request:', err);
			setLoading(false);
		}
	};

	const resetVacations = async () => {
		try {
			setLoading(false);
			setError(null);
			setFetched(false);
			setVacations([]);
			await MessageService.sendMessage('CLEAR_ALL_DATA', { scope: 'vacations' });
			setLoading(false);
		} catch (err) {
			console.error('Failed to reset vacations state:', err);
		}
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
		resetVacations,
		setFromDate,
		setToDate,
		setFilterType,
	};
};

export default useVacationChecker;
