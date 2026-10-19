import React from 'react';
import Calendar from '../calendar/calendar.component';
import WorkingDaysProgress from '../working-days-progress/working-days-progress.component';
import Container from '../shared/container/container.component';
import {
	TaskActions,
	TaskStatus,
} from '../shared/task-status/task-status.component';
import IncomeProgress from './components/income-progress.component';
import useProjectIncomeData from '../../hooks/use-project-income-data.hook';
import useHolidays from '../../hooks/use-holidays.hook';
import {
	countWorkingDays,
	formatDate,
	formatTimestamp,
	getMonthKey,
	getToday,
} from '../../utils/date.utils';
import { formatUsd } from '../../utils/income.utils';
import * as styles from './project-income-data.module.scss';

type Props = {
	jwt: string;
};

const ProjectIncomeData = ({ jwt }: Props) => {
	const {
		params,
		setParams,
		loading,
		progress,
		startedAt,
		error,
		result,
		start,
		cancel,
		clear,
	} = useProjectIncomeData();
	const holidays = useHolidays(jwt);
	const workingDays = countWorkingDays(new Date(), holidays);
	const currentMonth = getMonthKey(getToday());

	return (
		<Container>
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
				<TaskStatus progress={progress} error={error} startedAt={startedAt} />

				{result && !loading && (
					<div className={styles.resultCard}>
						<div className={styles.resultHeader}>
							<p className={styles.resultTitle}>Project income</p>
							<p className={styles.meta}>{result.data.projectCount} projects</p>
						</div>
						<p className={styles.resultValue}>
							{formatUsd(result.data.income)}
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
						{getMonthKey(result.params.fromDate) === currentMonth ? (
							<IncomeProgress
								income={result.data.income}
								month={currentMonth}
								workingDays={workingDays}
							/>
						) : (
							<p className={styles.note}>
								Planned vs. earned progress is shown when the period starts in
								the current month.
							</p>
						)}
					</div>
				)}
			</div>
			<WorkingDaysProgress
				workingDays={workingDays}
				holidayCount={holidays?.length ?? 0}
			/>
		</Container>
	);
};

export default ProjectIncomeData;
