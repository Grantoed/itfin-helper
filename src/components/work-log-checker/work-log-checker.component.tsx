import React from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Button from '../shared/button/button.component';
import Heading from '../shared/heading/heading.component';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
import { ButtonType } from '../shared/button/button.types';
import * as styles from './work-log-checker.module.scss';
import EmployeeCard from './components/employee-card.component';

type Props = {
	jwt: string;
};

const WorkLogChecker = ({ jwt }: Props) => {
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

			{error && <p className={styles.error}>{error}</p>}

			{fetched && !loading && employees.length === 0 && (
				<p className={styles.noData}>No data available.</p>
			)}

			{employees.length > 0 && (
				<div className={styles.resultContainer}>
					{employees
						.map(employee => {
							return <EmployeeCard employee={employee} />;
						})
						.filter(Boolean)}
				</div>
			)}
		</Container>
	);
};

export default WorkLogChecker;
