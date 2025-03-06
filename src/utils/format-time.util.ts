export const formatTime = (minutes: number) => {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours.toString().padStart(2, '0')}h ${mins
		.toString()
		.padStart(2, '0')}m`;
};
