import React from 'react';
import { TimeoffEvent } from '../../../services/vacations/types';
import * as styles from '../vacations-list.module.scss';
import { formatDateRange } from '../../../utils/calendar.utils';

type Props = {
	event: TimeoffEvent;
};

const VacationEvent = ({ event }: Props) => {
	const calculateDuration = (startDate: string, endDate: string): number => {
		// Create Date objects from ISO strings
		const start = new Date(startDate);
		const end = new Date(endDate);

		// Create UTC dates by extracting the date parts and creating new dates
		const startUTC = new Date(
			Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
		);
		const endUTC = new Date(
			Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
		);

		// Calculate the difference in days using UTC timestamps
		const diffTime = endUTC.getTime() - startUTC.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

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
