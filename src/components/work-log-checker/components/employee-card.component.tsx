import React from 'react';
import { formatDate } from '../../../utils/format-date.util';
import { formatTime } from '../../../utils/format-time.util';
import { EnhancedEmployeeRecord } from '../../../hooks/use-work-log-checker.hook';
import * as styles from '../work-log-checker.module.scss';

type Props = {
	employee: EnhancedEmployeeRecord;
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
			<div className={styles.employeeMetadataWrapper}>
				<div className={styles.employeeNameRoleWrapper}>
					<h3>
						{employee.FirstName} {employee.LastName}{' '}
					</h3>
					<span
						className={
							employee.isFreelancer
								? styles.freelancerBadge
								: styles.employeeBadge
						}
					>
						{employee.isFreelancer ? 'Freelancer' : 'Employee'}
					</span>
				</div>
				<span className={styles.deficitTime}>
					Underworked {formatTime(totalDeficit)}
				</span>
			</div>

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
