import { resultKey, stateKey } from '../../shared/tasks';

// Minimal in-memory chrome.* mock covering what the background uses
const createChromeMock = (initial: Record<string, any> = {}) => {
	const data: Record<string, any> = { ...initial };
	const pick = (keys: string | string[] | null) => {
		if (keys === null) return { ...data };
		const list = Array.isArray(keys) ? keys : [keys];
		return Object.fromEntries(
			list.filter(key => key in data).map(key => [key, data[key]])
		);
	};
	return {
		data,
		chrome: {
			storage: {
				local: {
					get: jest.fn(async (keys: string | string[] | null) => pick(keys)),
					set: jest.fn(async (items: Record<string, any>) => {
						Object.assign(data, items);
					}),
					remove: jest.fn(async (keys: string | string[]) => {
						for (const key of Array.isArray(keys) ? keys : [keys]) {
							delete data[key];
						}
					}),
				},
			},
			cookies: {
				get: jest.fn(async () => ({ value: 'jwt-token' })),
			},
			runtime: { getPlatformInfo: jest.fn() },
		},
	};
};

const jsonResponse = (body: unknown, status = 200) =>
	({
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response);

const projectsPage = (page: number, count: number, perPage = 25) => {
	const start = (page - 1) * perPage;
	const ids = Array.from(
		{ length: Math.max(0, Math.min(perPage, count - start)) },
		(_, i) => start + i + 1
	);
	return { data: { Count: count, Projects: ids.map(Id => ({ Id, Income: 10 })) } };
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const waitFor = async (check: () => boolean) => {
	for (let i = 0; i < 50 && !check(); i++) await flush();
	expect(check()).toBe(true);
};

const loadRunner = (initial?: Record<string, any>) => {
	const mock = createChromeMock(initial);
	(global as any).chrome = mock.chrome;
	let runner: typeof import('./task-runner');
	jest.isolateModules(() => {
		runner = require('./task-runner');
	});
	return { ...mock, runner: runner! };
};

const params = { fromDate: '2026-10-01', toDate: '2026-10-16' };

describe('task runner', () => {
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('clears tasks orphaned by a previous worker on boot', async () => {
		const { data, runner } = loadRunner({
			[stateKey('workLogs')]: { status: 'loading', params, timestamp: 1 },
			[stateKey('vacations')]: { status: 'error', params, timestamp: 1 },
		});
		await runner.cancelTask('projectIncome'); // awaits boot cleanup
		expect(data[stateKey('workLogs')]).toBeUndefined();
		expect(data[stateKey('vacations')]).toBeDefined();
	});

	it('fetches every project income page and stores the total', async () => {
		const fetchMock = jest
			.spyOn(global, 'fetch')
			.mockImplementation(async input => {
				const page = Number(new URL(String(input)).searchParams.get('page'));
				return jsonResponse(projectsPage(page, 60));
			});
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		expect(data[stateKey('projectIncome')]).toMatchObject({ status: 'loading' });

		await waitFor(() => Boolean(data[resultKey('projectIncome')]));
		expect(data[resultKey('projectIncome')]).toMatchObject({
			params,
			data: { income: 600, projectCount: 60 },
		});
		expect(data[stateKey('projectIncome')]).toBeUndefined();
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[0][1]).toMatchObject({
			headers: { Authorization: 'jwt-token' },
		});
	});

	it('reports a failed page instead of storing a partial total', async () => {
		jest.spyOn(global, 'fetch').mockImplementation(async input => {
			const page = Number(new URL(String(input)).searchParams.get('page'));
			return page === 3
				? jsonResponse({}, 401)
				: jsonResponse(projectsPage(page, 60));
		});
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		await waitFor(() => data[stateKey('projectIncome')]?.status === 'error');

		expect(data[stateKey('projectIncome')].error).toMatch(/session has expired/);
		expect(data[resultKey('projectIncome')]).toBeUndefined();
	});

	it('discards the result of a cancelled task', async () => {
		let release: () => void = () => undefined;
		jest.spyOn(global, 'fetch').mockImplementation(
			(_input, init) =>
				new Promise((resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
					);
					release = () => resolve(jsonResponse({ data: [] }));
				})
		);
		const { data, runner } = loadRunner();

		await runner.startTask('vacations', { ...params, filterType: 'company' });
		await runner.cancelTask('vacations');
		release();
		await flush();
		await flush();

		expect(data[stateKey('vacations')]).toBeUndefined();
		expect(data[resultKey('vacations')]).toBeUndefined();
	});

	it('fails fast when the user is not logged in', async () => {
		const fetchMock = jest.spyOn(global, 'fetch');
		const { chrome, data, runner } = loadRunner();
		chrome.cookies.get.mockResolvedValueOnce(null as any);

		await runner.startTask('workLogs', { ...params, teamId: '28' });
		await waitFor(() => data[stateKey('workLogs')]?.status === 'error');

		expect(data[stateKey('workLogs')].error).toMatch(/not logged in/);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
