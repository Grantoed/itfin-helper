import {
	countDays,
	countWorkingDays,
	formatDateRange,
	getFirstDayOfMonth,
	getLastFriday,
	getMonthsInRange,
	parseISODate,
	toISODate,
} from './date.utils';

// Run every assertion in timezones on both sides of UTC: day-shift bugs from
// mixing UTC and local dates only show up away from UTC.
const TIMEZONES = ['UTC', 'Europe/Kyiv', 'Pacific/Kiritimati', 'America/Los_Angeles'];

describe.each(TIMEZONES)('date utils in %s', timezone => {
	const originalTz = process.env.TZ;
	beforeAll(() => {
		process.env.TZ = timezone;
	});
	afterAll(() => {
		process.env.TZ = originalTz;
	});

	const at = (iso: string, hour = 0, minute = 30) => {
		const date = parseISODate(iso);
		date.setHours(hour, minute);
		return date;
	};

	it('round-trips local dates', () => {
		expect(toISODate(parseISODate('2026-03-01'))).toBe('2026-03-01');
		expect(toISODate(at('2026-10-01', 0, 5))).toBe('2026-10-01');
		expect(toISODate(at('2026-10-31', 23, 55))).toBe('2026-10-31');
	});

	it('returns the first day of the current month', () => {
		expect(getFirstDayOfMonth(at('2026-10-19', 1))).toBe('2026-10-01');
	});

	it.each([
		['2026-10-16', '2026-10-16'], // Friday itself
		['2026-10-17', '2026-10-16'], // Saturday
		['2026-10-19', '2026-10-16'], // Monday
		['2026-10-22', '2026-10-16'], // Thursday
		['2026-10-01', '2026-10-01'], // Thursday, previous Friday is in September
	])('last Friday for %s is %s', (today, expected) => {
		expect(getLastFriday(at(today, 0, 30))).toBe(expected);
		expect(getLastFriday(at(today, 23, 30))).toBe(expected);
	});

	it('counts working days up to last Friday', () => {
		// October 2026 has 22 weekdays; Oct 1-16 contains 12
		expect(countWorkingDays(at('2026-10-19'))).toEqual({
			passed: 12,
			total: 22,
			until: '2026-10-16',
		});
	});

	it('lists every month touched by a range', () => {
		expect(getMonthsInRange('2026-01-31', '2026-03-01')).toEqual([
			'2026-01-01',
			'2026-02-01',
			'2026-03-01',
		]);
		expect(getMonthsInRange('2026-12-15', '2027-01-02')).toEqual([
			'2026-12-01',
			'2027-01-01',
		]);
		expect(getMonthsInRange('2026-05-10', '2026-05-12')).toEqual([
			'2026-05-01',
		]);
	});

	it('counts inclusive days across DST changes', () => {
		expect(countDays('2026-10-19', '2026-10-19')).toBe(1);
		expect(countDays('2026-03-27', '2026-04-02')).toBe(7);
		expect(countDays('2026-10-23', '2026-11-03')).toBe(12);
	});

	it('formats date ranges', () => {
		expect(formatDateRange('2026-10-05', '2026-10-05')).toBe('Oct 5, 2026');
		expect(formatDateRange('2026-10-05T00:00:00.000Z', '2026-10-09')).toBe(
			'Oct 5 - Oct 9, 2026'
		);
		expect(formatDateRange('2026-12-28', '2027-01-03')).toBe(
			'Dec 28, 2026 - Jan 3, 2027'
		);
	});
});
