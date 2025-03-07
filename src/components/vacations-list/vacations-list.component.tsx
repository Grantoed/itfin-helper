import React from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Button from '../shared/button/button.component';
import Heading from '../shared/heading/heading.component';
import VacationFilter from './components/vacation-filter.component';
import VacationEvent from './components/vacation-event.component';
import useVacationChecker from '../../hooks/use-vacations-list.hook';
import { ButtonType } from '../shared/button/button.types';
import * as styles from './vacations-list.module.scss';

type Props = {
	jwt: string;
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
				<VacationFilter filterType={filterType} setFilterType={setFilterType} />
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
						<VacationEvent key={event.RefId} event={event} />
					))}
				</div>
			)}
		</Container>
	);
};

export default VacationsList;
