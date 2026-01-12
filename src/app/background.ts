// Background service worker for handling API requests
// This allows requests to continue even when the popup is closed

const BASE_URL = 'https://keenethics.itfin.io/api/v1';

interface MessageRequest {
	type: string;
	payload?: any;
}

interface MessageResponse {
	type: string;
	success: boolean;
	data?: any;
	error?: string;
	progress?: string;
}

// Storage keys
const STORAGE_KEYS = {
	PROJECT_INCOME: 'projectIncome',
	WORK_LOGS: 'workLogs',
	VACATIONS: 'vacations',
	REQUEST_STATE: 'requestState',
} as const;

type ClearScope = 'all' | 'projectIncome' | 'workLogs' | 'vacations';

const controllers: Record<
	Exclude<ClearScope, 'all'>,
	AbortController | null
> = {
	projectIncome: null,
	workLogs: null,
	vacations: null,
};

function abortForScope(scope: ClearScope) {
	if (scope === 'all' || scope === 'projectIncome') {
		controllers.projectIncome?.abort();
		broadcastToPopup({
			type: 'PROJECT_INCOME_CANCELLED',
			success: false,
			error: 'Cancelled by user',
		});
		controllers.projectIncome = null;
	}
	if (scope === 'all' || scope === 'workLogs') {
		controllers.workLogs?.abort();
		broadcastToPopup({
			type: 'WORK_LOGS_CANCELLED',
			success: false,
			error: 'Cancelled by user',
		});
		controllers.workLogs = null;
	}
	if (scope === 'all' || scope === 'vacations') {
		controllers.vacations?.abort();
		broadcastToPopup({
			type: 'VACATIONS_CANCELLED',
			success: false,
			error: 'Cancelled by user',
		});
		controllers.vacations = null;
	}
}

async function clearStoredData(scope: ClearScope) {
	const removals: string[] = [];
	const resets: Record<string, any> = {};

	if (scope === 'all' || scope === 'projectIncome') {
		removals.push(STORAGE_KEYS.PROJECT_INCOME);
	}
	if (scope === 'all' || scope === 'workLogs') {
		removals.push(STORAGE_KEYS.WORK_LOGS);
	}
	if (scope === 'all' || scope === 'vacations') {
		removals.push(STORAGE_KEYS.VACATIONS);
	}

	// Always clear request state
	resets[STORAGE_KEYS.REQUEST_STATE] = null;

	if (removals.length > 0) {
		await chrome.storage.local.remove(removals);
	}

	await chrome.storage.local.set(resets);
}

// Helper function to make API requests
async function makeRequest<T>(
	url: string,
	jwt: string,
	signal?: AbortSignal
): Promise<T> {
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: jwt,
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		signal,
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const result = await response.json();
	return result.data || result;
}

// Send message to popup if it's open
// Note: We can't directly send to popup, but popup can listen via chrome.runtime.onMessage
async function broadcastToPopup(message: MessageResponse) {
	try {
		// Broadcast message - popup will receive it if it has a listener
		chrome.runtime.sendMessage(message, () => {
			// Ignore errors if no listener (popup is closed)
			if (chrome.runtime.lastError) {
				// Popup is closed, that's fine
			}
		});
	} catch (error) {
		// No popup open, that's fine
	}
}

// Handle project income data request
async function handleProjectIncomeRequest(
	jwt: string,
	fromDate: string,
	toDate: string
) {
	const MAX_PROJECTS_PER_PAGE = 25;

	// If already running, do not start a duplicate
	if (controllers.projectIncome) {
		await broadcastToPopup({
			type: 'PROJECT_INCOME_PROGRESS',
			success: true,
			progress: 'A request is already in progress...',
		});
		return;
	}

	const controller = new AbortController();
	const signal = controller.signal;
	controllers.projectIncome = controller;

	try {
		// Store request state
		await chrome.storage.local.set({
			[STORAGE_KEYS.REQUEST_STATE]: {
				type: 'PROJECT_INCOME',
				loading: true,
				progress: 'Fetching the first page results...',
				timestamp: Date.now(),
			},
		});

		await broadcastToPopup({
			type: 'PROJECT_INCOME_PROGRESS',
			success: true,
			progress: 'Fetching the first page results...',
		});

		// Kick off first two pages in parallel
		const firstPageUrl = `${BASE_URL}/tracking/projects-summary?page=1&filter[from]=${encodeURIComponent(
			fromDate
		)}&filter[to]=${encodeURIComponent(toDate)}`;
		const secondPageUrl = `${BASE_URL}/tracking/projects-summary?page=2&filter[from]=${encodeURIComponent(
			fromDate
		)}&filter[to]=${encodeURIComponent(toDate)}`;

		// Start both requests
		const firstPagePromise = makeRequest<any>(firstPageUrl, jwt, signal);
		const secondPagePromise = makeRequest<any>(secondPageUrl, jwt, signal);

		// Wait for the first response to know total pages ASAP
		const firstCompleted = await Promise.race([
			firstPagePromise,
			secondPagePromise,
		]);

		const totalProjects = firstCompleted.Count;
		const totalPages = Math.ceil(totalProjects / MAX_PROJECTS_PER_PAGE);

		// Update request state
		await chrome.storage.local.set({
			[STORAGE_KEYS.REQUEST_STATE]: {
				type: 'PROJECT_INCOME',
				loading: true,
				progress: `Determined total pages: ${totalPages}. Collecting results...`,
				timestamp: Date.now(),
			},
		});

		await broadcastToPopup({
			type: 'PROJECT_INCOME_PROGRESS',
			success: true,
			progress: `Determined total pages: ${totalPages}. Collecting results...`,
		});

		const allProjects: any[] = [];
		const receivedPages = new Map<number, boolean>();

		// Collect the first two pages as they resolve
		const pagePromises: Promise<any>[] = [];

		pagePromises.push(
			firstPagePromise.then(response => {
				if (!receivedPages.has(1)) {
					receivedPages.set(1, true);
					allProjects.push(...(response.Projects || []));
					// Update progress after page 1
					chrome.storage.local.set({
						[STORAGE_KEYS.REQUEST_STATE]: {
							type: 'PROJECT_INCOME',
							loading: true,
							progress: `Fetched ${receivedPages.size} of ${totalPages} pages...`,
							timestamp: Date.now(),
						},
					});
					broadcastToPopup({
						type: 'PROJECT_INCOME_PROGRESS',
						success: true,
						progress: `Fetched ${receivedPages.size} of ${totalPages} pages...`,
					});
				}
				return response;
			})
		);

		pagePromises.push(
			secondPagePromise.then(response => {
				if (!receivedPages.has(2)) {
					receivedPages.set(2, true);
					allProjects.push(...(response.Projects || []));
					// Update progress after page 2
					chrome.storage.local.set({
						[STORAGE_KEYS.REQUEST_STATE]: {
							type: 'PROJECT_INCOME',
							loading: true,
							progress: `Fetched ${receivedPages.size} of ${totalPages} pages...`,
							timestamp: Date.now(),
						},
					});
					broadcastToPopup({
						type: 'PROJECT_INCOME_PROGRESS',
						success: true,
						progress: `Fetched ${receivedPages.size} of ${totalPages} pages...`,
					});
				}
				return response;
			})
		);

		if (totalPages <= 1) {
			// Wait for the first page promise to finish populating allProjects
			await Promise.allSettled(pagePromises);

			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: {
					type: 'PROJECT_INCOME',
					loading: true,
					progress: `Completed! Fetched 1 page of 1 total.`,
				},
			});

			await broadcastToPopup({
				type: 'PROJECT_INCOME_PROGRESS',
				success: true,
				progress: `Completed! Fetched 1 page of 1 total.`,
			});
		} else {
			// Add remaining pages (starting from page 3)
			for (let page = 3; page <= totalPages; page++) {
				const pageUrl = `${BASE_URL}/tracking/projects-summary?page=${page}&filter[from]=${encodeURIComponent(
					fromDate
				)}&filter[to]=${encodeURIComponent(toDate)}`;
				pagePromises.push(
					makeRequest<any>(pageUrl, jwt, signal).then(response => {
						receivedPages.set(page, true);
						allProjects.push(...(response.Projects || []));
						// Update request state
						chrome.storage.local.set({
							[STORAGE_KEYS.REQUEST_STATE]: {
								type: 'PROJECT_INCOME',
								loading: true,
								progress: `Fetched ${receivedPages.size} of ${totalPages} pages...`,
								timestamp: Date.now(),
							},
						});

						broadcastToPopup({
							type: 'PROJECT_INCOME_PROGRESS',
							success: true,
							progress: `Fetched ${receivedPages.size} of ${totalPages} pages...`,
						});
						return response;
					})
				);
			}

			if (pagePromises.length > 0) {
				await Promise.allSettled(pagePromises);
			}
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: {
					type: 'PROJECT_INCOME',
					loading: true,
					progress: `Completed! Fetched ${receivedPages.size} pages of ${totalPages} total.`,
					timestamp: Date.now(),
				},
			});
			await broadcastToPopup({
				type: 'PROJECT_INCOME_PROGRESS',
				success: true,
				progress: `Completed! Fetched ${receivedPages.size} pages of ${totalPages} total.`,
			});
		}

		const totalIncome = allProjects.reduce(
			(sum: number, project: any) => sum + project.Income,
			0
		);

		const result = {
			income: totalIncome,
			fromDate,
			toDate,
			timestamp: Date.now(),
		};

		// Save to storage and clear request state
		await chrome.storage.local.set({
			[STORAGE_KEYS.PROJECT_INCOME]: result,
			[STORAGE_KEYS.REQUEST_STATE]: null,
		});

		// Send result
		await broadcastToPopup({
			type: 'PROJECT_INCOME_SUCCESS',
			success: true,
			data: result,
		});
	} catch (error: any) {
		if (error.name === 'AbortError') {
			// Request was cancelled; clear state and notify
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: null,
			});
			await broadcastToPopup({
				type: 'PROJECT_INCOME_CANCELLED',
				success: false,
				error: 'Request cancelled',
			});
		} else {
			console.error('Failed to fetch project income data:', error);
			// Clear request state on error
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: null,
			});
			await broadcastToPopup({
				type: 'PROJECT_INCOME_ERROR',
				success: false,
				error: 'An error occurred while fetching data.',
			});
		}
	} finally {
		controllers.projectIncome = null;
	}
}

// Handle work logs request
async function handleWorkLogsRequest(
	jwt: string,
	teamId: string,
	fromDate: string,
	toDate: string,
	hideFreelancers: boolean
) {
	// If already running, do not start a duplicate
	if (controllers.workLogs) {
		await broadcastToPopup({
			type: 'WORK_LOGS_PROGRESS',
			success: true,
			progress: 'A request is already in progress...',
		});
		return;
	}

	const controller = new AbortController();
	const signal = controller.signal;
	controllers.workLogs = controller;

	try {
		// Store request state
		await chrome.storage.local.set({
			[STORAGE_KEYS.REQUEST_STATE]: {
				type: 'WORK_LOGS',
				loading: true,
				progress: 'Fetching work logs...',
				timestamp: Date.now(),
			},
		});
		const queryParams = `filter[from]=${encodeURIComponent(
			fromDate
		)}&filter[to]=${encodeURIComponent(toDate)}`;

		const [trackingData, employmentType] = await Promise.all([
			makeRequest<any[]>(
				`${BASE_URL}/teams/${teamId}/tracking?${queryParams}`,
				jwt,
				signal
			),
			makeRequest<any>(
				`${BASE_URL}/teams/${teamId}/agreements?${queryParams}`,
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
		await chrome.storage.local.set({
			[STORAGE_KEYS.WORK_LOGS]: result,
			[STORAGE_KEYS.REQUEST_STATE]: null,
		});

		// Send result
		await broadcastToPopup({
			type: 'WORK_LOGS_SUCCESS',
			success: true,
			data: result,
		});
	} catch (error: any) {
		if (error.name === 'AbortError') {
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: null,
			});
			await broadcastToPopup({
				type: 'WORK_LOGS_CANCELLED',
				success: false,
				error: 'Request cancelled',
			});
		} else {
			console.error('Failed to fetch work logs:', error);
			// Clear request state on error
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: null,
			});
			await broadcastToPopup({
				type: 'WORK_LOGS_ERROR',
				success: false,
				error: 'Failed to fetch work logs',
			});
		}
	} finally {
		controllers.workLogs = null;
	}
}

// Handle vacations request
async function handleVacationsRequest(
	jwt: string,
	fromDate: string,
	toDate: string,
	filterType: string
) {
	// If already running, do not start a duplicate
	if (controllers.vacations) {
		await broadcastToPopup({
			type: 'VACATIONS_PROGRESS',
			success: true,
			progress: 'A request is already in progress...',
		});
		return;
	}

	const controller = new AbortController();
	const signal = controller.signal;
	controllers.vacations = controller;

	try {
		// Store request state
		await chrome.storage.local.set({
			[STORAGE_KEYS.REQUEST_STATE]: {
				type: 'VACATIONS',
				loading: true,
				progress: 'Fetching vacations...',
				timestamp: Date.now(),
			},
		});
		const months = getMonthsInRange(fromDate, toDate);
		let allEvents: any[] = [];

		for (const monthDate of months) {
			const queryParams = `date=${encodeURIComponent(
				monthDate
			)}&filter[type]=${encodeURIComponent(filterType)}`;
			const monthEvents = await makeRequest<any[]>(
				`${BASE_URL}/calendar?${queryParams}`,
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

		// Save to storage and clear request state
		await chrome.storage.local.set({
			[STORAGE_KEYS.VACATIONS]: result,
			[STORAGE_KEYS.REQUEST_STATE]: null,
		});

		// Send result
		await broadcastToPopup({
			type: 'VACATIONS_SUCCESS',
			success: true,
			data: result,
		});
	} catch (error: any) {
		if (error.name === 'AbortError') {
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: null,
			});
			await broadcastToPopup({
				type: 'VACATIONS_CANCELLED',
				success: false,
				error: 'Request cancelled',
			});
		} else {
			console.error('Failed to fetch vacations:', error);
			// Clear request state on error
			await chrome.storage.local.set({
				[STORAGE_KEYS.REQUEST_STATE]: null,
			});
			await broadcastToPopup({
				type: 'VACATIONS_ERROR',
				success: false,
				error: 'Failed to fetch vacation data',
			});
		}
	} finally {
		controllers.vacations = null;
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

// Message listener
chrome.runtime.onMessage.addListener(
	(message: MessageRequest, sender, sendResponse) => {
		// Handle async operations
		(async () => {
			try {
				switch (message.type) {
					case 'FETCH_PROJECT_INCOME':
						handleProjectIncomeRequest(
							message.payload.jwt,
							message.payload.fromDate,
							message.payload.toDate
						);
						sendResponse({ success: true });
						break;

					case 'FETCH_WORK_LOGS':
						handleWorkLogsRequest(
							message.payload.jwt,
							message.payload.teamId,
							message.payload.fromDate,
							message.payload.toDate,
							message.payload.hideFreelancers
						);
						sendResponse({ success: true });
						break;

					case 'FETCH_VACATIONS':
						handleVacationsRequest(
							message.payload.jwt,
							message.payload.fromDate,
							message.payload.toDate,
							message.payload.filterType
						);
						sendResponse({ success: true });
						break;

					case 'GET_CACHED_DATA':
						const cachedData = await chrome.storage.local.get([
							STORAGE_KEYS.PROJECT_INCOME,
							STORAGE_KEYS.WORK_LOGS,
							STORAGE_KEYS.VACATIONS,
							STORAGE_KEYS.REQUEST_STATE,
						]);
						sendResponse({ success: true, data: cachedData });
						break;

					case 'CLEAR_REQUEST_STATE':
						await chrome.storage.local.set({
							[STORAGE_KEYS.REQUEST_STATE]: null,
						});
						sendResponse({ success: true });
						break;

					case 'CLEAR_ALL_DATA': {
						const scope: ClearScope = message.payload?.scope || 'all';
						abortForScope(scope);
						await clearStoredData(scope);
						sendResponse({ success: true });
						break;
					}

					default:
						sendResponse({ success: false, error: 'Unknown message type' });
				}
			} catch (error: any) {
				sendResponse({ success: false, error: error.message });
			}
		})();

		// Return true to indicate we will send a response asynchronously
		return true;
	}
);

// Listen for messages from popup (for progress updates)
chrome.runtime.onConnect.addListener(port => {
	port.onMessage.addListener((message: MessageResponse) => {
		// Handle any messages from popup if needed
	});
});
