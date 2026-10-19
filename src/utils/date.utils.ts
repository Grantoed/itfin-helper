// Date helpers. App dates are plain 'YYYY-MM-DD' strings in the user's local
// calendar. Never round-trip them through toISOString()/new Date('YYYY-MM-DD'):
// both use UTC and shift the day by one depending on the timezone.

export const MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

const pad = (value: number) => String(value).padStart(2, '0');

export const toISODate = (date: Date): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Parses 'YYYY-MM-DD' (or the date part of an ISO timestamp) as a local date
export const parseISODate = (value: string): Date => {
	const [year, month, day] = value.slice(0, 10).split('-').map(Number);
	return new Date(year, month - 1, day);
};

export const getFirstDayOfMonth = (now = new Date()): string =>
	toISODate(new Date(now.getFullYear(), now.getMonth(), 1));

export const getToday = (now = new Date()): string => toISODate(now);

export const addDays = (date: string, days: number): string => {
	const shifted = parseISODate(date);
	shifted.setDate(shifted.getDate() + days);
	return toISODate(shifted);
};

// Most recent Friday (today if it is Friday). Falls back to today when that
// Friday belongs to the previous month.
export const getLastFriday = (now = new Date()): string => {
	const daysSinceFriday = (now.getDay() + 2) % 7;
	const friday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() - daysSinceFriday
	);
	return friday.getMonth() === now.getMonth()
		? toISODate(friday)
		: toISODate(now);
};

// The Sunday after last Friday, so the range includes that weekend; never
// later than today.
export const getLastWeekendEnd = (now = new Date()): string => {
	const sunday = addDays(getLastFriday(now), 2);
	const today = getToday(now);
	return sunday < today ? sunday : today;
};

export type WorkingDays = { passed: number; total: number; until: string };

// Working days in the current month, and how many of them passed up to last
// Friday. Weekends and the given public holidays ('YYYY-MM-DD') don't count.
export const countWorkingDays = (
	now = new Date(),
	holidays: string[] = []
): WorkingDays => {
	const until = getLastFriday(now);
	const year = now.getFullYear();
	const month = now.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const holidaySet = new Set(holidays);

	let total = 0;
	let passed = 0;
	for (let day = 1; day <= daysInMonth; day++) {
		const date = new Date(year, month, day);
		const weekday = date.getDay();
		const iso = toISODate(date);
		if (weekday === 0 || weekday === 6 || holidaySet.has(iso)) continue;
		total++;
		if (iso <= until) passed++;
	}

	return { passed, total, until };
};

export const getMonthKey = (date: string) => date.slice(0, 7);

// 'YYYY-MM-01' for every month touched by the range
export const getMonthsInRange = (
	fromDate: string,
	toDate: string
): string[] => {
	const end = parseISODate(toDate);
	const cursor = parseISODate(fromDate);
	cursor.setDate(1);

	const months: string[] = [];
	while (cursor <= end) {
		months.push(toISODate(cursor));
		cursor.setMonth(cursor.getMonth() + 1);
	}
	return months;
};

// 'YYYY-MM-DD' -> 'DD/MM/YYYY'
export const formatDate = (value: string): string => {
	const [year, month, day] = value.slice(0, 10).split('-');
	return `${day}/${month}/${year}`;
};

export const formatShortDate = (value: string): string => {
	const date = parseISODate(value);
	return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

export const formatDateRange = (startDate: string, endDate: string): string => {
	const start = parseISODate(startDate);
	const end = parseISODate(endDate);

	if (start.getTime() === end.getTime()) {
		return `${formatShortDate(startDate)}, ${start.getFullYear()}`;
	}
	const startYear =
		start.getFullYear() === end.getFullYear() ? '' : `, ${start.getFullYear()}`;
	return `${formatShortDate(startDate)}${startYear} - ${formatShortDate(
		endDate
	)}, ${end.getFullYear()}`;
};

// Inclusive number of calendar days in the range
export const countDays = (startDate: string, endDate: string): number => {
	const start = parseISODate(startDate);
	const end = parseISODate(endDate);
	return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
};

export const formatTimestamp = (value: number): string =>
	new Date(value).toLocaleString(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	});
