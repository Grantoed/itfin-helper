import { STORAGE_KEYS } from '../constants';
import { broadcastToPopup } from '../messaging';
import { makeRequest } from '../request-utils';
import {
	clearController,
	hasActiveController,
	setController,
} from '../controllers';
import { cacheData, clearRequestState, setRequestState } from '../storage';

const SCOPE = 'workLogs';

export async function handleWorkLogsRequest(
	jwt: string,
	teamId: string,
	fromDate: string,
	toDate: string,
	hideFreelancers: boolean
) {
	// If already running, do not start a duplicate
	if (hasActiveController(SCOPE)) {
		await broadcastToPopup({
			type: 'WORK_LOGS_PROGRESS',
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
			type: 'WORK_LOGS',
			loading: true,
			progress: 'Fetching work logs...',
			timestamp: Date.now(),
		});
		const queryParams = `filter[from]=${encodeURIComponent(
			fromDate
		)}&filter[to]=${encodeURIComponent(toDate)}`;

		const [trackingData, employmentType] = await Promise.all([
			makeRequest<any[]>(
				`/teams/${teamId}/tracking?${queryParams}`,
				jwt,
				signal
			),
			makeRequest<any>(
				`/teams/${teamId}/agreements?${queryParams}`,
				jwt,
				signal
			),
		]);

		const employmentTypeMap = new Map();
		employmentType.Data.forEach((employee: any) => {
			const isFreelancer = employee.UserType === 'freelancer';
			employmentTypeMap.set(employee.Id, isFreelancer);
		});

		const enhancedEmployees = trackingData.map((employee: any) => ({
			...employee,
			isFreelancer: employmentTypeMap.get(employee.Id) || false,
		}));

		const result = {
			employees: enhancedEmployees,
			fromDate,
			toDate,
			teamId,
			hideFreelancers,
			timestamp: Date.now(),
		};

		// Save to storage and clear request state
		await cacheData(STORAGE_KEYS.WORK_LOGS, result);
		await clearRequestState();

		await broadcastToPopup({
			type: 'WORK_LOGS_SUCCESS',
			success: true,
			data: result,
		});
	} catch (error: any) {
		if (error.name === 'AbortError') {
			await clearRequestState();
			await broadcastToPopup({
				type: 'WORK_LOGS_CANCELLED',
				success: false,
				error: 'Request cancelled',
			});
		} else {
			console.error('Failed to fetch work logs:', error);
			await clearRequestState();
			await broadcastToPopup({
				type: 'WORK_LOGS_ERROR',
				success: false,
				error: 'Failed to fetch work logs',
			});
		}
	} finally {
		clearController(SCOPE);
	}
}
