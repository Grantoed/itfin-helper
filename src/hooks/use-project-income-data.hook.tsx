import { useState, useEffect } from 'react';
import { getFirstDayOfMonth, getLastFriday } from '../utils/calendar.utils';
import useJWT from './use-jwt.hook';
import { MessageService } from '../utils/message-service.util';

const useProjectIncomeData = () => {
	const STALE_REQUEST_MS = 5 * 60 * 1000;
	const [loading, setLoading] = useState(false);
	const [income, setIncome] = useState<number | null>(null);
	const [fromDate, setFromDate] = useState<string>(getFirstDayOfMonth());
	const [toDate, setToDate] = useState<string>(getLastFriday());
	const [progress, setProgress] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [fetchedAt, setFetchedAt] = useState<number | null>(null);

	const jwt = useJWT();

	// Load cached data on mount and when dates change
	useEffect(() => {
		const loadCachedData = async () => {
			try {
				const cachedData = await MessageService.getCachedData();

				// Check for in-progress request (and clear stale ones)
				const state = cachedData.requestState;
				if (state && state.type === 'PROJECT_INCOME' && state.loading) {
					const isMissingTimestamp = !state.timestamp;
					const isStale =
						state.timestamp && Date.now() - state.timestamp > STALE_REQUEST_MS;
					if (isStale || isMissingTimestamp) {
						await MessageService.sendMessage('CLEAR_REQUEST_STATE');
						setLoading(false);
						setProgress(null);
					} else {
						setLoading(true);
						if (state.progress) {
							setProgress(state.progress);
						}
					}
				}

				if (cachedData.projectIncome) {
					const cached = cachedData.projectIncome;
					// Only use cached data if dates match
					if (
						cached.fromDate === fromDate &&
						cached.toDate === toDate &&
						cached.income !== null
					) {
						setIncome(cached.income);
						setFetchedAt(cached.timestamp ?? null);
					} else {
						// Clear income if dates don't match
						setIncome(null);
						setFetchedAt(null);
					}
				} else {
					setFetchedAt(null);
				}
			} catch (err) {
				console.error('Failed to load cached data:', err);
			}
		};

		loadCachedData();
	}, [fromDate, toDate]);

	// Listen for messages from background script
	useEffect(() => {
		const unsubscribeProgress = MessageService.onMessage(
			'PROJECT_INCOME_PROGRESS',
			response => {
				if (response.progress) {
					setProgress(response.progress);
				}
			}
		);

		const unsubscribeSuccess = MessageService.onMessage(
			'PROJECT_INCOME_SUCCESS',
			response => {
				if (response.data) {
					setIncome(response.data.income);
					setFetchedAt(response.data.timestamp ?? null);
					setProgress(null);
					setLoading(false);
				}
			}
		);

		const unsubscribeError = MessageService.onMessage(
			'PROJECT_INCOME_ERROR',
			response => {
				setError(response.error || 'An error occurred while fetching data.');
				setProgress(null);
				setLoading(false);
			}
		);

		const unsubscribeCancelled = MessageService.onMessage(
			'PROJECT_INCOME_CANCELLED',
			() => {
				setProgress(null);
				setLoading(false);
				setError(null);
			}
		);

		return () => {
			unsubscribeProgress();
			unsubscribeSuccess();
			unsubscribeError();
			unsubscribeCancelled();
		};
	}, []);

	const getProjectIncomeData = async (): Promise<void> => {
		if (!jwt) return;
		if (loading) return;

		if (new Date(fromDate) > new Date(toDate)) {
			setError('Error: Start date cannot be later than the end date.');
			return;
		}

		setError(null);
		setLoading(true);
		setIncome(null);
		setFetchedAt(null);
		setProgress('Fetching initial data...');

		try {
			// ensure any stale request_state is cleared before new request
			await MessageService.sendMessage('CLEAR_REQUEST_STATE');
			await MessageService.sendMessage('FETCH_PROJECT_INCOME', {
				jwt,
				fromDate,
				toDate,
			});
		} catch (error: any) {
			console.error('Failed to send project income request:', error);
			setError('Failed to initiate request.');
			setLoading(false);
			setProgress(null);
		}
	};

	const resetProjectIncome = async () => {
		try {
			setLoading(false);
			setProgress(null);
			setError(null);
			setIncome(null);
			setFetchedAt(null);
			await MessageService.sendMessage('CLEAR_ALL_DATA', { scope: 'projectIncome' });
			// Clear any cached request state locally to re-enable button immediately
			setProgress(null);
			setLoading(false);
		} catch (err) {
			console.error('Failed to reset project income state:', err);
		}
	};

	return {
		getProjectIncomeData,
		resetProjectIncome,
		loading,
		income,
		fromDate,
		setFromDate,
		toDate,
		setToDate,
		progress,
		error,
		fetchedAt,
	};
};

export default useProjectIncomeData;
