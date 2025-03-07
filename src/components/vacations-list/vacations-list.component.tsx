import React from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Button from '../shared/button/button.component';
import Heading from '../shared/heading/heading.component';
import useVacationChecker from '../../hooks/use-vacations-list.hook';
import { formatDateRange } from '../../utils/calendar.utils';
import { ButtonType } from '../shared/button/button.types';
import * as styles from './vacations-list.module.scss';

type Props = {
	jwt: string;
};

const calculateDuration = (startDate: string, endDate: string): number => {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffTime = Math.abs(end.getTime() - start.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
	return diffDays;
};

const VacationsList = ({ jwt }: Props) => {
	const {
		fromDate,
		toDate,
		vacations,
		loading,
		error,
		fetched,
		filterType,
		fetchVacations,
		setFromDate,
		setToDate,
		setFilterType,
	} = useVacationChecker(jwt);

	return (
		<Container>
			<Heading>Vacations</Heading>

			<div className={styles.wrapper}>
				<Calendar
					fromDate={fromDate}
					toDate={toDate}
					setFromDate={setFromDate}
					setToDate={setToDate}
				/>

				<div className={styles.filterContainer}>
					<label className={styles.radioLabel}>
						<input
							type="radio"
							name="filterType"
							value="company"
							checked={filterType === 'company'}
							onChange={() => setFilterType('company')}
							className={styles.radioInput}
						/>
						Company
					</label>
					<label className={styles.radioLabel}>
						<input
							type="radio"
							name="filterType"
							value="team"
							checked={filterType === 'team'}
							onChange={() => setFilterType('team')}
							className={styles.radioInput}
						/>
						Team
					</label>
				</div>

				<Button
					onClick={fetchVacations}
					disabled={loading}
					additionalProps={{
						btnType: ButtonType.TEXT,
						text: loading ? 'Fetching Data...' : 'Check',
					}}
				/>
			</div>

			{error && <p className={styles.error}>{error}</p>}

			{fetched && !loading && vacations.length === 0 && (
				<p className={styles.noData}>No time off scheduled for this period.</p>
			)}

			{vacations.length > 0 && (
				<div className={styles.resultContainer}>
					{vacations.map(event => (
						<div
							key={`${event.RefId}-${event.Date}`}
							className={styles.employeeCard}
						>
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
					))}
				</div>
			)}
		</Container>
	);
};

export default VacationsList;
