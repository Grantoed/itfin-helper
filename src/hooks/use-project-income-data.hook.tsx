import { useState } from 'react';
import { getFirstDayOfMonth, getLastFriday } from '../utils/calendar.utils';
import { projectsSummaryService } from '../services/projects-summary/projects-summary.service';
import { ITFinResponse } from '../services/projects-summary/types';
import useJWT from './use-jwt.hook';

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
		setProgress('Fetching first page...');

		try {
			const firstPageResponse: ITFinResponse =
				await projectsSummaryService.getProjectsSummaryResponse(
					{ page: 1, 'filter[from]': fromDate, 'filter[to]': toDate },
					{ headers: { Authorization: jwt } }
				);

			const totalProjects = firstPageResponse.Count;
			const totalPages = Math.ceil(
				totalProjects / MAX_PROJECT_PROJECTS_PER_PAGE
			);
			let allProjects = firstPageResponse.Projects;

			setProgress(`Total pages: ${totalPages}. Page 1 fetched.`);

			if (totalPages > 1) {
				for (let page = 2; page <= totalPages; page++) {
					setProgress(`Fetching page ${page}/${totalPages}...`);
					const response =
						await projectsSummaryService.getProjectsSummaryResponse(
							{ page, 'filter[from]': fromDate, 'filter[to]': toDate },
							{ headers: { Authorization: jwt } }
						);
					allProjects = [...allProjects, ...response.Projects];
					setProgress(`Page ${page} fetched (${page}/${totalPages})...`);
				}
			}

			const totalIncome = allProjects.reduce(
				(sum, project) => sum + project.Income,
				0
			);
			setIncome(totalIncome);
			setProgress(`Completed! Fetched ${totalPages} pages.`);
		} catch (error) {
			console.error('Failed to fetch project income data:', error);
			setIncome(null);
			setProgress('Error fetching data.');
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
