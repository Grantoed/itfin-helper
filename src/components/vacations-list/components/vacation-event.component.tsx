import React from 'react';
import { TimeoffEvent } from '../../../services/vacations/types';
import * as styles from '../vacations-list.module.scss';
import { formatDateRange } from '../../../utils/calendar.utils';

type Props = {
	event: TimeoffEvent;
};

const VacationEvent = ({ event }: Props) => {
	const calculateDuration = (startDate: string, endDate: string): number => {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
		return diffDays;
	};

	return (
		<div key={`${event.RefId}-${event.Date}`} className={styles.employeeCard}>
			<h3>
				{event.Entity.FirstName} {event.Entity.LastName}{' '}
				<span>({event.EventType})</span>
			</h3>
			<div className={styles.vacationInfo}>
				<span>{formatDateRange(event.StartDate, event.EndDate)}</span>
				<span className={styles.duration}>
					{calculateDuration(event.StartDate, event.EndDate)} days
				</span>
			</div>
		</div>
	);
};

export default VacationEvent;
