import React, { useMemo } from 'react';
import Container from '../shared/container/container.component';
import ResultsHeader from '../shared/copy-button/results-header.component';
import MarkdownText from '../shared/copy-button/markdown-text.component';
import {
	TaskActions,
	TaskStatus,
} from '../shared/task-status/task-status.component';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
import { PREF_KEYS } from '../../shared/constants';
import { usePersistentState } from '../../utils/store.util';
import { formatTime } from '../../utils/work-log.utils';
import * as styles from './work-log-checker.module.scss';
import WorkLogControls from './components/work-log-controls.component';
import ResultsList from './components/results-list.component';

type Props = {
	jwt: string;
};

const WorkLogChecker = ({ jwt }: Props) => {
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
		teamOptions,
		loadingTeams,
		setSelectedTeam,
		hideFreelancers,
		setHideFreelancers,
		summaries,
	} = useWorkLogChecker(jwt);
	const [showMarkdown, setShowMarkdown] = usePersistentState(
		PREF_KEYS.MARKDOWN_WORK_LOGS,
		false
	);

	const markdownText = useMemo(
		() =>
			(summaries ?? [])
				.map(
					({ employee, deficit }) =>
						`- ${employee.FirstName} ${
							employee.LastName
						} — Underworked ${formatTime(deficit)}`
				)
				.join('\n'),
		[summaries]
	);

	const hasSummaries = Boolean(summaries?.length);

	return (
		<Container>
			<div className={styles.wrapper}>
				<WorkLogControls
					fromDate={params.fromDate}
					toDate={params.toDate}
					onDatesChange={(fromDate, toDate) =>
						setParams(current => ({ ...current, fromDate, toDate }))
					}
					teamOptions={teamOptions}
					selectedTeam={params.teamId}
					setSelectedTeam={setSelectedTeam}
					loadingTeams={loadingTeams}
					loading={loading}
					hideFreelancers={hideFreelancers}
					setHideFreelancers={setHideFreelancers}
				/>
				<TaskActions
					fetchLabel="Fetch work logs"
					loading={loading}
					disabled={!params.teamId}
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

			{summaries && !loading && !hasSummaries && (
				<p className={styles.noData}>
					{result?.data.employees.length
						? 'Everyone logged their full hours for this period.'
						: 'No employees found for this team and period.'}
				</p>
			)}

			{hasSummaries && !loading && (
				<>
					<ResultsHeader
						copyText={markdownText}
						markdown={{
							shown: showMarkdown,
							onToggle: () => setShowMarkdown(!showMarkdown),
						}}
					>
						Didn't log full time ({summaries!.length})
					</ResultsHeader>
					{showMarkdown ? (
						<MarkdownText
							text={markdownText}
							label="Work log gaps as markdown"
						/>
					) : (
						<ResultsList summaries={summaries!} />
					)}
				</>
			)}
		</Container>
	);
};

export default WorkLogChecker;
