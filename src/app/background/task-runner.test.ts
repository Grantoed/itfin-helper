import { INTERRUPTED_MESSAGE, resultKey, stateKey } from '../../shared/tasks';

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
			runtime: {
				getPlatformInfo: jest.fn(),
				getContexts: jest.fn(async () => [] as unknown[]),
				ContextType: { POPUP: 'POPUP' },
			},
			action: {
				setBadgeText: jest.fn(async () => undefined),
				setBadgeBackgroundColor: jest.fn(async () => undefined),
				setBadgeTextColor: jest.fn(async () => undefined),
			},
		},
	};
};

const jsonResponse = (body: unknown, status = 200) =>
	({
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	} as Response);

const projectsPage = (page: number, count: number, perPage: number) => {
	const start = (page - 1) * perPage;
	const ids = Array.from(
		{ length: Math.max(0, Math.min(perPage, count - start)) },
		(_, i) => start + i + 1
	);
	return {
		data: { Count: count, Projects: ids.map(Id => ({ Id, Income: 10 })) },
	};
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

	// Serves projects-summary, capping the page size like a server might
	const mockProjectsSummary = (count: number, maxSize = Infinity) =>
		jest.spyOn(global, 'fetch').mockImplementation(async input => {
			const url = new URL(String(input));
			const page = Number(url.searchParams.get('page'));
			const size = Math.min(
				Number(url.searchParams.get('size') || 25),
				maxSize
			);
			return jsonResponse(projectsPage(page, count, size));
		});

	it('marks tasks orphaned by a previous worker as interrupted on boot', async () => {
		const failed = { status: 'error', params, error: 'Boom', timestamp: 1 };
		const { data, runner } = loadRunner({
			[stateKey('workLogs')]: {
				status: 'loading',
				params,
				progress: 'Fetching work logs…',
				startedAt: 1,
				timestamp: 1,
			},
			[stateKey('vacations')]: failed,
		});
		await runner.cancelTask('projectIncome'); // awaits boot recovery
		expect(data[stateKey('workLogs')]).toMatchObject({
			status: 'error',
			params,
			error: INTERRUPTED_MESSAGE,
			progress: undefined,
		});
		expect(data[stateKey('vacations')]).toEqual(failed);
	});

	it('replaces an interrupted error when the task is started again', async () => {
		mockProjectsSummary(1);
		const { data, runner } = loadRunner({
			[stateKey('projectIncome')]: { status: 'loading', params, timestamp: 1 },
		});

		await runner.startTask('projectIncome', params);
		expect(data[stateKey('projectIncome')]).toMatchObject({
			status: 'loading',
		});
		await waitFor(() => Boolean(data[resultKey('projectIncome')]));
		expect(data[stateKey('projectIncome')]).toBeUndefined();
	});

	it('fetches all project income in a single request', async () => {
		const fetchMock = mockProjectsSummary(60);
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		expect(data[stateKey('projectIncome')]).toMatchObject({
			status: 'loading',
		});

		await waitFor(() => Boolean(data[resultKey('projectIncome')]));
		expect(data[resultKey('projectIncome')]).toMatchObject({
			params,
			data: { income: 600, projectCount: 60 },
		});
		expect(data[stateKey('projectIncome')]).toBeUndefined();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String(fetchMock.mock.calls[0][0])).toContain('size=1000');
		expect(fetchMock.mock.calls[0][1]).toMatchObject({
			headers: { Authorization: 'jwt-token' },
		});
	});

	it('pages through the rest when the server caps the page size', async () => {
		const fetchMock = mockProjectsSummary(60, 25);
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		await waitFor(() => Boolean(data[resultKey('projectIncome')]));

		expect(data[resultKey('projectIncome')].data).toEqual({
			income: 600,
			projectCount: 60,
		});
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('reports a failed page instead of storing a partial total', async () => {
		jest.spyOn(global, 'fetch').mockImplementation(async input => {
			const page = Number(new URL(String(input)).searchParams.get('page'));
			return page === 3
				? jsonResponse({}, 401)
				: jsonResponse(projectsPage(page, 60, 25));
		});
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		await waitFor(() => data[stateKey('projectIncome')]?.status === 'error');

		expect(data[stateKey('projectIncome')].error).toMatch(
			/session has expired/
		);
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

	it('drops work log days outside the employment period', async () => {
		const day = (Date: string, MinutesInt = 0) => ({
			Date,
			MinutesInt,
			MinutesExt: 0,
			isWeekend: false,
			isHoliday: false,
			log: [] as unknown[],
		});
		jest.spyOn(global, 'fetch').mockImplementation(async input =>
			String(input).includes('/agreements')
				? jsonResponse({ Data: [{ Id: 2, UserType: 'freelancer' }], Count: 1 })
				: jsonResponse([
						{
							Id: 1,
							FirstName: 'A',
							LastName: 'A',
							BusinessHours: 6,
							DateOfEmployment: '2026-10-02T00:00:00.000Z',
							DateOfRetiring: null as string | null,
							Log: { Data: [day('2026-10-01'), day('2026-10-02', 360)] },
						},
						{
							Id: 2,
							FirstName: 'B',
							LastName: 'B',
							BusinessHours: 8,
							DateOfEmployment: '2020-01-01T00:00:00.000Z',
							DateOfRetiring: '2026-10-01T00:00:00.000Z',
							Log: { Data: [day('2026-10-01', 480), day('2026-10-02')] },
						},
				  ])
		);
		const { data, runner } = loadRunner();

		await runner.startTask('workLogs', { ...params, teamId: '28' });
		await waitFor(() => Boolean(data[resultKey('workLogs')]));

		const [hired, retired] = data[resultKey('workLogs')].data.employees;
		expect(hired).toMatchObject({ dailyMinutes: 360, isFreelancer: false });
		expect(hired.days.map((d: { Date: string }) => d.Date)).toEqual([
			'2026-10-02',
		]);
		expect(retired).toMatchObject({ dailyMinutes: 480, isFreelancer: true });
		expect(retired.days.map((d: { Date: string }) => d.Date)).toEqual([
			'2026-10-01',
		]);
	});

	it('joins vacations ITFin split at a month boundary', async () => {
		const timeoff = (
			RefId: number,
			start: string,
			end: string,
			personId = 7
		) => ({
			EventType: 'Vacation',
			RefEntity: 'Timeoff',
			RefId,
			Date: `${start}T00:00:00.000Z`,
			StartDate: `${start}T00:00:00.000Z`,
			EndDate: `${end}T23:59:00.000Z`,
			Entity: { Id: personId, FirstName: 'Olena', LastName: 'S' },
		});
		const months: Record<string, unknown[]> = {
			'2026-09-01': [timeoff(1, '2026-09-28', '2026-09-30')],
			'2026-10-01': [
				{
					EventType: 'Holiday',
					RefEntity: 'Holiday',
					Name: 'Defenders Day',
					Date: '2026-10-14T00:00:00.000Z',
				},
				timeoff(2, '2026-10-01', '2026-10-02'),
				timeoff(3, '2026-10-01', '2026-10-01', 8),
				{ EventType: 'Birthday', Date: '2026-10-05T00:00:00.000Z' },
			],
		};
		const fetchMock = jest
			.spyOn(global, 'fetch')
			.mockImplementation(async input =>
				jsonResponse(
					months[new URL(String(input)).searchParams.get('date')!] ?? []
				)
			);
		const { data, runner } = loadRunner();

		await runner.startTask('vacations', {
			fromDate: '2026-10-01',
			toDate: '2026-10-16',
			filterType: 'company',
		});
		await waitFor(() => Boolean(data[resultKey('vacations')]));

		// October starts with a vacation, so September is fetched too
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(data[resultKey('vacations')].data.vacations).toEqual([
			expect.objectContaining({
				EmployeeId: 7,
				StartDate: '2026-09-28',
				EndDate: '2026-10-02',
			}),
			expect.objectContaining({
				EmployeeId: 8,
				StartDate: '2026-10-01',
				EndDate: '2026-10-01',
			}),
		]);
		expect(data[resultKey('vacations')].data.holidays).toEqual([
			{ Date: '2026-10-14', Name: 'Defenders Day' },
		]);
	});

	describe('toolbar badge', () => {
		const lastBadge = (
			chrome: ReturnType<typeof createChromeMock>['chrome']
		) => {
			const calls = chrome.action.setBadgeText.mock.calls as unknown as [
				{ text: string }
			][];
			return calls[calls.length - 1]?.[0].text;
		};

		it('shows progress, then a check mark when the popup is closed', async () => {
			mockProjectsSummary(1);
			const { chrome, data, runner } = loadRunner();

			await runner.startTask('projectIncome', params);
			expect(lastBadge(chrome)).toBe('…');

			await waitFor(() => Boolean(data[resultKey('projectIncome')]));
			await waitFor(() => lastBadge(chrome) === '✓');
		});

		it('shows an error mark when a task fails', async () => {
			jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, 500));
			const { chrome, runner } = loadRunner();

			await runner.startTask('projectIncome', params);
			await waitFor(() => lastBadge(chrome) === '!');
		});

		it('stays clear when the popup is open to see the result', async () => {
			mockProjectsSummary(1);
			const { chrome, data, runner } = loadRunner();
			chrome.runtime.getContexts.mockResolvedValue([{}]);

			await runner.startTask('projectIncome', params);
			await waitFor(() => Boolean(data[resultKey('projectIncome')]));
			await flush();
			expect(lastBadge(chrome)).toBe('');
		});
	});

	it('flags the session as expired on 401 and clears it on success', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, 401));
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		await waitFor(() => data['session:expired'] === true);
		await flush(); // let the failed task finish before starting again

		mockProjectsSummary(1); // ITFin accepts the session again
		await runner.startTask('projectIncome', params);
		await waitFor(() => data['session:expired'] === false);
	});

	it('does not flag the session for other errors', async () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, 500));
		const { data, runner } = loadRunner();

		await runner.startTask('projectIncome', params);
		await waitFor(() => data[stateKey('projectIncome')]?.status === 'error');
		expect(data['session:expired']).toBeUndefined();
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
