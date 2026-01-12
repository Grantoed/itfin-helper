import { STORAGE_KEYS } from '../constants';
import { broadcastToPopup } from '../messaging';
import { makeRequest } from '../request-utils';
import {
	clearController,
	hasActiveController,
	setController,
} from '../controllers';
import { cacheData, clearRequestState, setRequestState } from '../storage';

const MAX_PROJECTS_PER_PAGE = 25;
const SCOPE = 'projectIncome';

export async function handleProjectIncomeRequest(
	jwt: string,
	fromDate: string,
	toDate: string
) {
	// If already running, do not start a duplicate
	if (hasActiveController(SCOPE)) {
		await broadcastToPopup({
			type: 'PROJECT_INCOME_PROGRESS',
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
			type: 'PROJECT_INCOME',
			loading: true,
			progress: 'Fetching the first page results...',
			timestamp: Date.now(),
		});

		await broadcastToPopup({
			type: 'PROJECT_INCOME_PROGRESS',
			success: true,
			progress: 'Fetching the first page results...',
		});

		// Kick off first two pages in parallel
		const firstPagePromise = makeRequest<any>(
			`/tracking/projects-summary?page=1&filter[from]=${encodeURIComponent(
				fromDate
			)}&filter[to]=${encodeURIComponent(toDate)}`,
			jwt,
			signal
		);
		const secondPagePromise = makeRequest<any>(
			`/tracking/projects-summary?page=2&filter[from]=${encodeURIComponent(
				fromDate
			)}&filter[to]=${encodeURIComponent(toDate)}`,
			jwt,
			signal
		);

		// Wait for the first response to know total pages ASAP
		const firstCompleted = await Promise.race([
			firstPagePromise,
			secondPagePromise,
		]);

		const totalProjects = firstCompleted.Count;
		const totalPages = Math.ceil(totalProjects / MAX_PROJECTS_PER_PAGE);

		await setRequestState({
			type: 'PROJECT_INCOME',
			loading: true,
			progress: `Determined total pages: ${totalPages}. Collecting results...`,
			timestamp: Date.now(),
		});

		await broadcastToPopup({
			type: 'PROJECT_INCOME_PROGRESS',
			success: true,
			progress: `Determined total pages: ${totalPages}. Collecting results...`,
		});

		const allProjects: any[] = [];
		const receivedPages = new Map<number, boolean>();

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
			await Promise.allSettled(pagePromises);

			await setRequestState({
				type: 'PROJECT_INCOME',
				loading: true,
				progress: `Completed! Fetched 1 page of 1 total.`,
			});

			await broadcastToPopup({
				type: 'PROJECT_INCOME_PROGRESS',
				success: true,
				progress: `Completed! Fetched 1 page of 1 total.`,
			});
		} else {
			// Add remaining pages (starting from page 3)
			for (let page = 3; page <= totalPages; page++) {
				pagePromises.push(
					makeRequest<any>(
						`/tracking/projects-summary?page=${page}&filter[from]=${encodeURIComponent(
							fromDate
						)}&filter[to]=${encodeURIComponent(toDate)}`,
						jwt,
						signal
					).then(response => {
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
			await setRequestState({
				type: 'PROJECT_INCOME',
				loading: true,
				progress: `Completed! Fetched ${receivedPages.size} pages of ${totalPages} total.`,
				timestamp: Date.now(),
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
		await cacheData(STORAGE_KEYS.PROJECT_INCOME, result);
		await clearRequestState();

		// Send result
		await broadcastToPopup({
			type: 'PROJECT_INCOME_SUCCESS',
			success: true,
			data: result,
		});
	} catch (error: any) {
		if (error.name === 'AbortError') {
			await clearRequestState();
			await broadcastToPopup({
				type: 'PROJECT_INCOME_CANCELLED',
				success: false,
				error: 'Request cancelled',
			});
		} else {
			console.error('Failed to fetch project income data:', error);
			await clearRequestState();
			await broadcastToPopup({
				type: 'PROJECT_INCOME_ERROR',
				success: false,
				error: 'An error occurred while fetching data.',
			});
		}
	} finally {
		clearController(SCOPE);
	}
}
