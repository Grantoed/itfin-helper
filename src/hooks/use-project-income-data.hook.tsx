import { useState } from 'react';
import { getFirstDayOfMonth, getLastFriday } from '../utils/calendar.utils';
import { projectsSummaryService } from '../services/projects-summary/projects-summary.service';
import useJWT from './use-jwt.hook';
import { Project } from '../services/projects-summary/types';

const useProjectIncomeData = () => {
	const [loading, setLoading] = useState(false);
	const [income, setIncome] = useState<number | null>(null);
	const [fromDate, setFromDate] = useState<string>(getFirstDayOfMonth());
	const [toDate, setToDate] = useState<string>(getLastFriday());
	const [progress, setProgress] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const MAX_PROJECT_PROJECTS_PER_PAGE = 25;

	const jwt = useJWT();

	const getProjectIncomeData = async (): Promise<void> => {
		if (!jwt) return;

		if (new Date(fromDate) > new Date(toDate)) {
			setError('Error: Start date cannot be later than the end date.');
			return;
		}

		setError(null);
		setLoading(true);
		setIncome(null);
		setProgress('Fetching initial data...');

		// Create an AbortController for managing request cancellations
		const controller = new AbortController();
		const signal = controller.signal;

		try {
			// Start by fetching the first two pages in parallel
			const firstPagePromise =
				projectsSummaryService.getProjectsSummaryResponse(
					{ page: 1, 'filter[from]': fromDate, 'filter[to]': toDate },
					{ headers: { Authorization: jwt }, signal }
				);

			const secondPagePromise =
				projectsSummaryService.getProjectsSummaryResponse(
					{ page: 2, 'filter[from]': fromDate, 'filter[to]': toDate },
					{ headers: { Authorization: jwt }, signal }
				);

			// Use Promise.race to get whichever response finishes first
			const firstResponse = await Promise.race([
				firstPagePromise,
				secondPagePromise,
			]);

			const totalProjects = firstResponse.Count;
			const totalPages = Math.ceil(
				totalProjects / MAX_PROJECT_PROJECTS_PER_PAGE
			);

			setProgress(
				`Determined total pages: ${totalPages}. Collecting results...`
			);

			// Create a map to track which pages we've received
			const receivedPages = new Map();
			const allProjects: Project[] = [];

			// If we only need one page, cancel the second request
			if (totalPages <= 1) {
				controller.abort();

				// Add the projects from the response we already have
				if (firstResponse.Projects) {
					allProjects.push(...firstResponse.Projects);
				}

				setProgress(`Completed! Fetched 1 page of 1 total.`);
			} else {
				// We need multiple pages - create a collection of promises for all pages
				const pagePromises = [];

				// Keep track of the two promises we already started
				pagePromises.push(
					firstPagePromise
						.then(response => {
							if (!receivedPages.has(1)) {
								receivedPages.set(1, true);
								allProjects.push(...response.Projects);
							}
							return response;
						})
						.catch(err => {
							if (err.name !== 'AbortError') {
								throw err;
							}
						})
				);

				pagePromises.push(
					secondPagePromise
						.then(response => {
							if (!receivedPages.has(2)) {
								receivedPages.set(2, true);
								allProjects.push(...response.Projects);
							}
							return response;
						})
						.catch(err => {
							if (err.name !== 'AbortError') {
								throw err;
							}
						})
				);

				// Start requests for any remaining pages
				for (let page = 3; page <= totalPages; page++) {
					pagePromises.push(
						projectsSummaryService
							.getProjectsSummaryResponse(
								{ page, 'filter[from]': fromDate, 'filter[to]': toDate },
								{ headers: { Authorization: jwt }, signal }
							)
							.then(response => {
								receivedPages.set(page, true);
								allProjects.push(...response.Projects);
								setProgress(
									`Fetched ${receivedPages.size} of ${totalPages} pages...`
								);
								return response;
							})
							.catch(err => {
								if (err.name !== 'AbortError') {
									throw err;
								}
							})
					);
				}

				// Wait for all requests to complete
				await Promise.allSettled(pagePromises);
				setProgress(
					`Completed! Fetched ${receivedPages.size} pages of ${totalPages} total.`
				);
			}

			// Calculate the total income
			const totalIncome = allProjects.reduce(
				(sum, project) => sum + project.Income,
				0
			);

			setIncome(totalIncome);
		} catch (error: any) {
			// Check if this is an abort error (which means we canceled it intentionally)
			if (error.name !== 'AbortError') {
				console.error('Failed to fetch project income data:', error);
				setIncome(null);
				setProgress('Error fetching data.');
				setError('An error occurred while fetching data.');
			}
		} finally {
			setLoading(false);
		}
	};

	return {
		getProjectIncomeData,
		loading,
		income,
		fromDate,
		setFromDate,
		toDate,
		setToDate,
		progress,
		error,
	};
};

export default useProjectIncomeData;
