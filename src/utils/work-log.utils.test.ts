import type { WorkLogEmployee } from '../shared/tasks';
import { formatTime, summarizeWorkLogs } from './work-log.utils';

const day = (Date: string, MinutesInt: number, extra = {}) => ({
	Date,
	MinutesInt,
	isWeekend: false,
	isHoliday: false,
	...extra,
});

const employee = (
	Id: number,
	days: WorkLogEmployee['days'],
	isFreelancer = false,
	dailyMinutes = 480
): WorkLogEmployee => ({
	Id,
	FirstName: `First${Id}`,
	LastName: `Last${Id}`,
	isFreelancer,
	dailyMinutes,
	days,
});

describe('summarizeWorkLogs', () => {
	const employees = [
		employee(1, [day('2026-10-01', 480), day('2026-10-02', 480)]),
		employee(2, [day('2026-10-01', 240), day('2026-10-02', 480)]),
		employee(3, [day('2026-10-01', 0), day('2026-10-02', 0)], true),
		employee(4, [
			day('2026-10-03', 0, { isWeekend: true }),
			day('2026-10-05', 0, { isHoliday: true }),
		]),
		// Overtime on one day covers a short day
		employee(5, [day('2026-10-01', 600), day('2026-10-02', 400)]),
	];

	it('lists underworked employees, worst first', () => {
		const result = summarizeWorkLogs(employees, false);
		expect(result.map(s => [s.employee.Id, s.deficit])).toEqual([
			[3, 960],
			[2, 240],
		]);
		expect(result[1].underworkedDays.map(d => d.Date)).toEqual(['2026-10-01']);
	});

	it("uses each employee's own working hours", () => {
		const partTime = employee(
			6,
			[day('2026-10-01', 240), day('2026-10-02', 200)],
			false,
			240
		);
		expect(summarizeWorkLogs([partTime], false)).toEqual([
			expect.objectContaining({
				deficit: 40,
				underworkedDays: [partTime.days[1]],
			}),
		]);
	});

	it('falls back to 8h for results cached without dailyMinutes', () => {
		const legacy = {
			...employee(7, [day('2026-10-01', 300)]),
			dailyMinutes: undefined,
		} as unknown as WorkLogEmployee;
		expect(summarizeWorkLogs([legacy], false)[0].deficit).toBe(180);
	});

	it('can hide freelancers', () => {
		const result = summarizeWorkLogs(employees, true);
		expect(result.map(s => s.employee.Id)).toEqual([2]);
	});
});

describe('formatTime', () => {
	it('formats minutes as hours and minutes', () => {
		expect(formatTime(0)).toBe('00h 00m');
		expect(formatTime(65)).toBe('01h 05m');
		expect(formatTime(960)).toBe('16h 00m');
	});
});
