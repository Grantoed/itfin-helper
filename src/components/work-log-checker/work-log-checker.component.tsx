import React, { useMemo, useState } from 'react';
import Container from '../shared/container/container.component';
import Heading from '../shared/heading/heading.component';
import MarkdownView from '../shared/markdown-view/markdown-view.component';
import { TaskActions, TaskStatus } from '../shared/task-status/task-status.component';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
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
	const [showMarkdown, setShowMarkdown] = useState(false);

	const markdownText = useMemo(
		() =>
			(summaries ?? [])
				.map(
					({ employee, deficit }) =>
						`- ${employee.FirstName} ${employee.LastName} — Underworked ${formatTime(
							deficit
						)}`
				)
				.join('\n'),
		[summaries]
	);

	const hasSummaries = Boolean(summaries?.length);

	return (
		<Container>
			<Heading>Work Log Checker</Heading>
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
					showMarkdown={showMarkdown}
					setShowMarkdown={setShowMarkdown}
					markdownToggleDisabled={!hasSummaries}
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

			{hasSummaries &&
				(showMarkdown ? (
					<MarkdownView text={markdownText} />
				) : (
					<ResultsList summaries={summaries!} />
				))}
		</Container>
	);
};

export default WorkLogChecker;
