import React from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Button from '../shared/button/button.component';
import Heading from '../shared/heading/heading.component';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
import { formatTime } from '../../utils/format-time.util';
import { ButtonType } from '../shared/button/button.types';
import * as styles from './work-log-checker.module.scss';

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
		<Container>
			<Heading>Work Log Checker</Heading>
			<div className={styles.wrapper}>
				<Calendar
					fromDate={fromDate}
					toDate={toDate}
					setFromDate={setFromDate}
					setToDate={setToDate}
				/>
				<Button
					onClick={fetchWorkLogs}
					disabled={!jwt || loading}
					additionalProps={{
						btnType: ButtonType.TEXT,
						text: loading ? 'Fetching Data...' : 'Check',
					}}
				/>
			</div>
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
		</Container>
	);
};

export default WorkLogChecker;
