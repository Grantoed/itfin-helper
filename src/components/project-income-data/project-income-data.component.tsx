import React from 'react';
import Calendar from '../calendar/calendar.component';
import Button from '../button/button.component';
import { ButtonType } from '../button/button.types';
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
	} = useProjectIncomeData();

	return (
		<div className={styles.container}>
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
					text: loading ? 'Fetching Data...' : 'Get Project Income Data',
				}}
			/>
			<pre>{progress}</pre>

			<pre>
				{loading
					? 'Fetching project income...'
					: income !== null
					? `Total Project Income: $${income.toFixed(2)}`
					: 'Project income will appear here...'}
			</pre>
		</div>
	);
};

export default ProjectIncomeData;
