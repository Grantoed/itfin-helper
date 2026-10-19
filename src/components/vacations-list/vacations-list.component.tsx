import React, { useMemo, useState } from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Heading from '../shared/heading/heading.component';
import MarkdownView from '../shared/markdown-view/markdown-view.component';
import { TaskActions, TaskStatus } from '../shared/task-status/task-status.component';
import VacationFilter from './components/vacation-filter.component';
import VacationEvent from './components/vacation-event.component';
import useVacationsList from '../../hooks/use-vacations-list.hook';
import { countDays, formatDateRange } from '../../utils/date.utils';
import * as styles from './vacations-list.module.scss';

const VacationsList = () => {
	const [showMarkdown, setShowMarkdown] = useState(false);
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
		setFilterType,
	} = useVacationsList();

	const vacations = result?.data.vacations;

	const markdownText = useMemo(
		() =>
			(vacations ?? [])
				.map(event => {
					const days = countDays(event.StartDate, event.EndDate);
					return `- ${event.FirstName} ${event.LastName} (${
						event.EventType
					}), ${formatDateRange(event.StartDate, event.EndDate)} – ${days} ${
						days === 1 ? 'day' : 'days'
					}`;
				})
				.join('\n'),
		[vacations]
	);

	return (
		<Container>
			<Heading>Vacations</Heading>

			<div className={styles.wrapper}>
				<Calendar
					fromDate={params.fromDate}
					toDate={params.toDate}
					onChange={(fromDate, toDate) =>
						setParams(current => ({ ...current, fromDate, toDate }))
					}
					disabled={loading}
				/>
				<div className={styles.filterRow}>
					<VacationFilter
						filterType={params.filterType}
						setFilterType={setFilterType}
						disabled={loading}
					/>
					<div className={styles.toggleContainer}>
						<input
							type="checkbox"
							id="markdown-toggle-vacations"
							checked={showMarkdown}
							onChange={e => setShowMarkdown(e.target.checked)}
							disabled={!vacations?.length}
						/>
						<label htmlFor="markdown-toggle-vacations">
							Show markdown view
						</label>
					</div>
				</div>
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
					fetchedAt={result?.timestamp}
				/>
			</div>

			{vacations && !loading && vacations.length === 0 && (
				<p className={styles.noData}>No time off scheduled for this period.</p>
			)}

			{!!vacations?.length &&
				(showMarkdown ? (
					<MarkdownView text={markdownText} />
				) : (
					<div className={styles.resultContainer}>
						{vacations.map(event => (
							<VacationEvent
								key={`${event.RefId}-${event.StartDate}`}
								event={event}
							/>
						))}
					</div>
				))}
		</Container>
	);
};

export default VacationsList;
