import React from 'react';
import type { Vacation } from '../../../shared/tasks';
import { countDays, formatDateRange } from '../../../utils/date.utils';
import * as styles from '../vacations-list.module.scss';

type Props = {
	event: Vacation;
};

const VacationEvent = ({ event }: Props) => {
	const days = countDays(event.StartDate, event.EndDate);

	return (
		<div className={styles.employeeCard}>
			<h3>
				{event.FirstName} {event.LastName} <span>({event.EventType})</span>
			</h3>
			<div className={styles.vacationInfo}>
				<span>{formatDateRange(event.StartDate, event.EndDate)}</span>
				<span className={styles.duration}>
					{days} {days === 1 ? 'day' : 'days'}
				</span>
			</div>
		</div>
	);
};

export default VacationEvent;
