import React, { useMemo } from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import ResultsHeader from '../shared/copy-button/results-header.component';
import MarkdownText from '../shared/copy-button/markdown-text.component';
import {
	TaskActions,
	TaskStatus,
} from '../shared/task-status/task-status.component';
import VacationFilter from './components/vacation-filter.component';
import VacationEvent from './components/vacation-event.component';
import useVacationsList from '../../hooks/use-vacations-list.hook';
import { PREF_KEYS } from '../../shared/constants';
import { usePersistentState } from '../../utils/store.util';
import {
	countDays,
	formatDateRange,
	formatShortDate,
} from '../../utils/date.utils';
import * as styles from './vacations-list.module.scss';

const VacationsList = () => {
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
		setFilterType,
	} = useVacationsList();
	const [showMarkdown, setShowMarkdown] = usePersistentState(
		PREF_KEYS.MARKDOWN_VACATIONS,
		false
	);

	const vacations = result?.data.vacations;
	const holidays = result?.data.holidays ?? [];
	const hasResults = Boolean(vacations?.length || holidays.length);

	const markdownText = useMemo(
		() =>
			[
				...holidays.map(
					holiday =>
						`- ${holiday.Name} (public holiday), ${formatDateRange(
							holiday.Date,
							holiday.Date
						)}`
				),
				...(vacations ?? []).map(event => {
					const days = countDays(event.StartDate, event.EndDate);
					return `- ${event.FirstName} ${event.LastName} (${
						event.EventType
					}), ${formatDateRange(event.StartDate, event.EndDate)} – ${days} ${
						days === 1 ? 'day' : 'days'
					}`;
				}),
			].join('\n'),
		[vacations, holidays]
	);

	return (
		<Container>
			<div className={styles.wrapper}>
				<Calendar
					fromDate={params.fromDate}
					toDate={params.toDate}
					onChange={(fromDate, toDate) =>
						setParams(current => ({ ...current, fromDate, toDate }))
					}
					disabled={loading}
				/>
				<VacationFilter
					filterType={params.filterType}
					setFilterType={setFilterType}
					disabled={loading}
				/>
				<TaskActions
					fetchLabel="Fetch vacations"
					loading={loading}
					canClear={Boolean(result || error)}
					onFetch={start}
					onCancel={cancel}
					onClear={clear}
				/>
				<TaskStatus
					progress={progress}
					error={error}
					startedAt={startedAt}
					fetchedAt={result?.timestamp}
				/>
			</div>

			{vacations && !loading && !hasResults && (
				<p className={styles.noData}>No time off scheduled for this period.</p>
			)}

			{hasResults && !loading && (
				<>
					<ResultsHeader
						copyText={markdownText}
						markdown={{
							shown: showMarkdown,
							onToggle: () => setShowMarkdown(!showMarkdown),
						}}
					>
						Time off ({vacations?.length ?? 0})
						{holidays.length ? ` · Holidays (${holidays.length})` : ''}
					</ResultsHeader>
					{showMarkdown ? (
						<MarkdownText text={markdownText} label="Time off as markdown" />
					) : (
						<div className={styles.resultContainer}>
							{holidays.map(holiday => (
								<div key={holiday.Date} className={styles.holidayCard}>
									<span>{holiday.Name}</span>
									<span className={styles.holidayDate}>
										{formatShortDate(holiday.Date)} · public holiday
									</span>
								</div>
							))}
							{(vacations ?? []).map(event => (
								<VacationEvent
									key={`${event.RefId}-${event.StartDate}`}
									event={event}
								/>
							))}
						</div>
					)}
				</>
			)}
		</Container>
	);
};

export default VacationsList;
