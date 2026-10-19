import { apiGet, mapWithConcurrency } from '../../../shared/api';
import type { ITFinResponse } from '../../../services/projects-summary/types';
import type { TaskDataMap, TaskParamsMap } from '../../../shared/tasks';
import type { TaskContext } from '../task-runner';

const FALLBACK_PAGE_SIZE = 25;
const MAX_PARALLEL_PAGES = 6;

export async function fetchProjectIncome(
	{ fromDate, toDate }: TaskParamsMap['projectIncome'],
	{ jwt, signal, report }: TaskContext
): Promise<TaskDataMap['projectIncome']> {
	const query = `filter[from]=${encodeURIComponent(
		fromDate
	)}&filter[to]=${encodeURIComponent(toDate)}`;
	const fetchPage = (page: number) =>
		apiGet<ITFinResponse>(
			`/tracking/projects-summary?page=${page}&${query}`,
			jwt,
			signal
		);

	report('Fetching the first page...');

	// Request page 2 speculatively so most ranges need only one round trip
	// before the remaining pages fan out.
	const firstPage = fetchPage(1);
	const secondPage = fetchPage(2);
	secondPage.catch(() => undefined); // awaited below only if it's needed

	const first = await firstPage;
	const pageSize = first.Projects?.length || FALLBACK_PAGE_SIZE;
	const totalPages = Math.max(1, Math.ceil((first.Count || 0) / pageSize));

	let fetched = 1;
	const onPage = (response: ITFinResponse) => {
		fetched++;
		report(`Fetched ${fetched} of ${totalPages} pages...`);
		return response;
	};
	report(`Fetched 1 of ${totalPages} pages...`);

	const remainingPages = Array.from(
		{ length: Math.max(0, totalPages - 2) },
		(_, i) => i + 3
	);
	const [second, rest] = await Promise.all([
		totalPages >= 2 ? secondPage.then(onPage) : null,
		mapWithConcurrency(remainingPages, MAX_PARALLEL_PAGES, page =>
			fetchPage(page).then(onPage)
		),
	]);

	// Dedupe by project id in case the server's ordering shifted between pages
	const projects = new Map<number, number>();
	for (const response of [first, second, ...rest]) {
		for (const project of response?.Projects ?? []) {
			projects.set(project.Id, project.Income || 0);
		}
	}

	let income = 0;
	projects.forEach(value => (income += value));

	return { income, projectCount: projects.size };
}
