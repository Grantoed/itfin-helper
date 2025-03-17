import React from 'react';
import Calendar from '../calendar/calendar.component';
import WorkingDaysProgress from '../working-days-progress/working-days-progress.component';
import Container from '../shared/container/container.component';
import Heading from '../shared/heading/heading.component';
import Button from '../shared/button/button.component';
import { ButtonType } from '../shared/button/button.types';
import useProjectIncomeData from '../../hooks/use-project-income-data.hook';
import * as styles from './project-income-data.module.scss';

type Props = {
	jwt: string;
};

const ProjectIncomeData = ({ jwt }: Props) => {
	const {
		getProjectIncomeData,
		loading,
		income,
		fromDate,
		setFromDate,
		toDate,
		setToDate,
		progress,
		error,
	} = useProjectIncomeData();

	return (
		<Container>
			<Heading>Project Income</Heading>
			<div className={styles.wrapper}>
				<Calendar
					fromDate={fromDate}
					toDate={toDate}
					setFromDate={setFromDate}
					setToDate={setToDate}
				/>
				<Button
					onClick={getProjectIncomeData}
					disabled={!jwt || loading}
					additionalProps={{
						btnType: ButtonType.TEXT,
						text: loading ? 'Fetching Data...' : 'Get Data',
					}}
				/>

				{error && <p className={styles.error}>{error}</p>}

				{progress && <p className={styles.text}>{progress}</p>}

				{!loading && income && (
					<p className={styles.text}>
						Total Project Income:
						<span className={styles.incomeResult}>
							{` $${income.toFixed(2)}`}
						</span>
					</p>
				)}
			</div>
			<WorkingDaysProgress />
		</Container>
	);
};

export default ProjectIncomeData;
