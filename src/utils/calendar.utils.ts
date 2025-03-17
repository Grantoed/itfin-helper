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

export const getFirstDayOfMonth = (): string => {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
		2,
		'0'
	)}-01`;
};

export const getLastFriday = (): string => {
	const now = new Date();
	const day = now.getDay();
	const diff = day >= 5 ? day - 5 : 7 + day - 5; // Days to subtract to get last Friday
	now.setDate(now.getDate() - diff);

	// Check if last Friday is before the first day of the current month
	const firstDayOfMonth = new Date(getFirstDayOfMonth());

	if (now < firstDayOfMonth) {
		// If last Friday is before first day of month, return today's date instead
		const today = new Date();
		return today.toISOString().split('T')[0]; // Format YYYY-MM-DD
	}

	return now.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

export const countWorkingDays = (): { passed: number; total: number } => {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

	const lastFridayString = getLastFriday();
	const lastFriday = new Date(lastFridayString);

	const targetDate = lastFriday.getDate();

	let total = 0;
	let passed = 0;

	for (let day = 1; day <= 31; day++) {
		const date = new Date(year, month, day);
		if (date.getMonth() !== month) break; // Stop when month changes

		const dayOfWeek = date.getDay();
		if (dayOfWeek !== 0 && dayOfWeek !== 6) {
			// Exclude weekends
			total++;
			if (day <= targetDate) passed++;
		}
	}

	return { passed, total };
};

const { passed, total } = countWorkingDays();

export const workProgress = `${passed}/${total} (${Math.round(
	(passed / total) * 100
)}%)`;

export const formatDateRange = (startDate: string, endDate: string): string => {
	// Create Date objects from ISO strings
	const start = new Date(startDate);
	const end = new Date(endDate);

	// Create local dates by extracting the date parts and creating new dates
	// This will handle timezone conversions properly
	const startLocal = new Date(
		start.getUTCFullYear(),
		start.getUTCMonth(),
		start.getUTCDate()
	);
	const endLocal = new Date(
		end.getUTCFullYear(),
		end.getUTCMonth(),
		end.getUTCDate()
	);

	// If the dates are the same after adjusting for timezone, show just one date
	const isSameDay = startLocal.getTime() === endLocal.getTime();

	if (isSameDay) {
		return `${
			MONTHS[startLocal.getMonth()]
		} ${startLocal.getDate()}, ${startLocal.getFullYear()}`;
	}

	// Otherwise, show the date range
	return `${MONTHS[startLocal.getMonth()]} ${startLocal.getDate()} - ${
		MONTHS[endLocal.getMonth()]
	} ${endLocal.getDate()}, ${endLocal.getFullYear()}`;
};
