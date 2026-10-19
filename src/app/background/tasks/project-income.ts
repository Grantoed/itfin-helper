import { apiGet, mapWithConcurrency } from '../../../shared/api';
import type { ITFinResponse } from '../../../services/projects-summary/types';
import type { TaskDataMap, TaskParamsMap } from '../../../shared/tasks';
import type { TaskContext } from '../task-runner';

// ITFin rebuilds the whole report for every page request (~1-2.5 min each),
// so ask for everything at once. `size` is the page-size param ITFin's own
// UI uses elsewhere; projects-summary honours it.
const PAGE_SIZE = 1000;
const MAX_PARALLEL_PAGES = 2;

export async function fetchProjectIncome(
	{ fromDate, toDate }: TaskParamsMap['projectIncome'],
	{ jwt, signal, report }: TaskContext
): Promise<TaskDataMap['projectIncome']> {
	const query = `filter[from]=${encodeURIComponent(
		fromDate
	)}&filter[to]=${encodeURIComponent(toDate)}`;
	const fetchPage = (page: number, size: number) =>
		apiGet<ITFinResponse>(
			`/tracking/projects-summary?page=${page}&size=${size}&${query}`,
			jwt,
			signal
		);

	report('Waiting for ITFin to build the report (usually 1–3 min)…');
	const first = await fetchPage(1, PAGE_SIZE);
	const responses = [first];

	// Fallback in case the server caps the page size: fetch the rest using
	// whatever page size it actually returned.
	const pageSize = first.Projects?.length || 0;
	const totalPages =
		pageSize > 0 ? Math.ceil((first.Count || 0) / pageSize) : 1;
	if (totalPages > 1) {
		let fetched = 1;
		report(`Fetched 1 of ${totalPages} pages…`);
		const rest = await mapWithConcurrency(
			Array.from({ length: totalPages - 1 }, (_, i) => i + 2),
			MAX_PARALLEL_PAGES,
			async page => {
				const response = await fetchPage(page, pageSize);
				report(`Fetched ${++fetched} of ${totalPages} pages…`);
				return response;
			}
		);
		responses.push(...rest);
	}

	// Dedupe by project id in case the server's ordering shifted between pages
	const projects = new Map<number, number>();
	for (const response of responses) {
		for (const project of response?.Projects ?? []) {
			projects.set(project.Id, project.Income || 0);
		}
	}

	let income = 0;
	projects.forEach(value => (income += value));

	return { income, projectCount: projects.size };
}
