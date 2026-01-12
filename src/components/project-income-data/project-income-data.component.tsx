import React from 'react';
import Calendar from '../calendar/calendar.component';
import WorkingDaysProgress from '../working-days-progress/working-days-progress.component';
import Container from '../shared/container/container.component';
import Heading from '../shared/heading/heading.component';
import Button from '../shared/button/button.component';
import { ButtonType } from '../shared/button/button.types';
import useProjectIncomeData from '../../hooks/use-project-income-data.hook';
import { formatDate } from '../../utils/format-date.util';
import * as styles from './project-income-data.module.scss';

type Props = {
	jwt: string;
};

const ProjectIncomeData = ({ jwt }: Props) => {
	const {
		getProjectIncomeData,
		resetProjectIncome,
		loading,
		income,
		fromDate,
		setFromDate,
		toDate,
		setToDate,
		progress,
		error,
		fetchedAt,
	} = useProjectIncomeData();
	const showClearButton = loading || income !== null || !!progress;
	const hasIncome = !loading && income !== null;

	const formatTimestamp = (value: number) => {
		return new Date(value).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short',
		});
	};

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
						text: loading ? 'Fetching data...' : 'Fetch income',
					}}
				/>
				{showClearButton && (
					<Button
						onClick={resetProjectIncome}
						disabled={!jwt ? true : false}
						variant="secondary"
						additionalProps={{
							btnType: ButtonType.TEXT,
							text: 'Clear',
						}}
					/>
				)}

				{error && <p className={styles.error}>{error}</p>}

				{progress && <p className={styles.text}>{progress}</p>}

				{hasIncome && (
					<div className={styles.resultCard}>
						<div className={styles.resultHeader}>
							<p className={styles.resultTitle}>Income results</p>
							{fetchedAt && (
								<p className={styles.meta}>
									<span className={styles.metaLabel}>Fetched:</span>{' '}
									{formatTimestamp(fetchedAt)}
								</p>
							)}
						</div>
						<p className={styles.resultValue}>{`$${income!.toFixed(2)}`}</p>
						<p className={styles.meta}>
							<span className={styles.metaLabel}>Period:</span>{' '}
							{`${formatDate(fromDate)} – ${formatDate(toDate)}`}
						</p>
					</div>
				)}
			</div>
			<WorkingDaysProgress />
		</Container>
	);
};

export default ProjectIncomeData;
