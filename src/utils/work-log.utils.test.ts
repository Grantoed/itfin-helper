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
	isFreelancer = false
): WorkLogEmployee => ({
	Id,
	FirstName: `First${Id}`,
	LastName: `Last${Id}`,
	isFreelancer,
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
