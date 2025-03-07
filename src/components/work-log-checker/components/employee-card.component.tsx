import React from 'react';
import { formatDate } from '../../../utils/format-date.util';
import { formatTime } from '../../../utils/format-time.util';
import { EmployeeRecord } from '../../../services/tracking/types';
import * as styles from '../work-log-checker.module.scss';

type Props = {
	employee: EmployeeRecord;
};

const EmployeeCard = ({ employee }: Props) => {
	const WORKDAY_IN_MINUTES = 480;

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
		<div key={employee.Id} className={styles.employeeCard}>
			<h3>
				{employee.FirstName} {employee.LastName}{' '}
				<span>(Underworked {formatTime(totalDeficit)})</span>
			</h3>
			<ul className={styles.daysList}>
				{underworkedDays.map(day => (
					<li key={day.Date}>
						<span className={styles.date}>{formatDate(day.Date)}</span>
						<span className={styles.time}>{formatTime(day.MinutesInt)}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

export default EmployeeCard;
