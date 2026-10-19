import React from 'react';
import { formatDate } from '../../../utils/date.utils';
import { formatTime, WorkLogSummary } from '../../../utils/work-log.utils';
import * as styles from '../work-log-checker.module.scss';

type Props = {
	summary: WorkLogSummary;
};

const EmployeeCard = ({
	summary: { employee, deficit, underworkedDays },
}: Props) => (
	<div className={styles.employeeCard}>
		<div className={styles.employeeMetadataWrapper}>
			<div className={styles.employeeNameRoleWrapper}>
				<h3>
					{employee.FirstName} {employee.LastName}
				</h3>
				<span
					className={
						employee.isFreelancer ? styles.freelancerBadge : styles.employeeBadge
					}
				>
					{employee.isFreelancer ? 'Freelancer' : 'Employee'}
				</span>
			</div>
			<span className={styles.deficitTime}>Underworked {formatTime(deficit)}</span>
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

export default EmployeeCard;
