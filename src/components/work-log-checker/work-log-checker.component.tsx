import React from 'react';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
import { formatTime } from '../../utils/format-time.util';

type Props = {
	jwt: string;
};

const WorkLogChecker = ({ jwt }: Props) => {
	const WORKDAY_IN_MINUTES = 480;

	const {
		fromDate,
		toDate,
		employees,
		loading,
		error,
		fetched,
		fetchWorkLogs,
		setFromDate,
		setToDate,
	} = useWorkLogChecker(jwt);
	return (
		<div>
			<h2>Work Log Checker</h2>
			<div>
				<input
					type="date"
					value={fromDate}
					onChange={e => setFromDate(e.target.value)}
				/>
				<input
					type="date"
					value={toDate}
					onChange={e => setToDate(e.target.value)}
				/>
				<button onClick={fetchWorkLogs}>Check</button>
			</div>
			{loading && <p>Loading...</p>}
			{error && <p>{error}</p>}
			{fetched && !loading && employees.length === 0 && (
				<p>No data available.</p>
			)}
			<div>
				{employees
					.map(employee => {
						const workDays = employee.Log.Data.filter(
							day => !day.isWeekend && !day.isHoliday
						);

						const totalMinutesWorked = workDays.reduce(
							(sum, day) => sum + day.MinutesInt,
							0
						);
						const expectedMinutes = workDays.length * WORKDAY_IN_MINUTES;
						const totalDeficit = expectedMinutes - totalMinutesWorked;

						if (totalDeficit <= 0) return null;

						const underworkedDays = workDays.filter(
							day => day.MinutesInt < WORKDAY_IN_MINUTES
						);

						return (
							<div key={employee.Id}>
								<h3>
									{employee.FirstName} {employee.LastName}{' '}
									<span>(Underworked {formatTime(totalDeficit)})</span>
								</h3>
								<ul>
									{underworkedDays.map(day => (
										<li key={day.Date}>
											{day.Date}: {formatTime(day.MinutesInt)}
										</li>
									))}
								</ul>
							</div>
						);
					})
					.filter(Boolean)}
			</div>
		</div>
	);
};

export default WorkLogChecker;
