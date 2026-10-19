import React from 'react';
import Calendar from '../calendar/calendar.component';
import WorkingDaysProgress from '../working-days-progress/working-days-progress.component';
import Container from '../shared/container/container.component';
import Heading from '../shared/heading/heading.component';
import { TaskActions, TaskStatus } from '../shared/task-status/task-status.component';
import useProjectIncomeData from '../../hooks/use-project-income-data.hook';
import { formatDate, formatTimestamp } from '../../utils/date.utils';
import * as styles from './project-income-data.module.scss';

const currency = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
});

const ProjectIncomeData = () => {
	const {
		params,
		setParams,
		loading,
		progress,
		error,
		result,
		start,
		cancel,
		clear,
	} = useProjectIncomeData();

	return (
		<Container>
			<Heading>Project Income</Heading>
			<div className={styles.wrapper}>
				<Calendar
					fromDate={params.fromDate}
					toDate={params.toDate}
					onChange={(fromDate, toDate) => setParams({ fromDate, toDate })}
					disabled={loading}
				/>
				<TaskActions
					fetchLabel="Fetch income"
					loading={loading}
					canClear={Boolean(result || error)}
					onFetch={start}
					onCancel={cancel}
					onClear={clear}
				/>
				<TaskStatus progress={progress} error={error} />

				{result && !loading && (
					<div className={styles.resultCard}>
						<div className={styles.resultHeader}>
							<p className={styles.resultTitle}>Income</p>
							<p className={styles.meta}>
								{result.data.projectCount} projects
							</p>
						</div>
						<p className={styles.resultValue}>
							{currency.format(result.data.income)}
						</p>
						<p className={styles.meta}>
							<span className={styles.metaLabel}>Period:</span>{' '}
							{`${formatDate(result.params.fromDate)} – ${formatDate(
								result.params.toDate
							)}`}
						</p>
						<p className={styles.meta}>
							<span className={styles.metaLabel}>Fetched:</span>{' '}
							{formatTimestamp(result.timestamp)}
						</p>
					</div>
				)}
			</div>
			<WorkingDaysProgress />
		</Container>
	);
};

export default ProjectIncomeData;
