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
	const today = now.getDate();

	let total = 0;
	let passed = 0;

	for (let day = 1; day <= 31; day++) {
		const date = new Date(year, month, day);
		if (date.getMonth() !== month) break; // Stop when month changes

		const dayOfWeek = date.getDay();
		if (dayOfWeek !== 0 && dayOfWeek !== 6) {
			// Exclude weekends
			total++;
			if (day <= today) passed++;
		}
	}

	return { passed, total };
};

const { passed, total } = countWorkingDays();

export const workProgress = `${passed}/${total} (${Math.round(
	(passed / total) * 100
)}%)`;

export const formatDateRange = (startDate: string, endDate: string): string => {
	const start = new Date(startDate);
	const end = new Date(endDate);

	const months = [
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

	const startMonth = months[start.getMonth()];
	const startDay = start.getDate();

	const endMonth = months[end.getMonth()];
	const endDay = end.getDate();
	const endYear = end.getFullYear();

	return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
};
