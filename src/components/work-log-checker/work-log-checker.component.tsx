import React, { useState } from 'react';
import Container from '../shared/container/container.component';
import Heading from '../shared/heading/heading.component';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
import * as styles from './work-log-checker.module.scss';
import WorkLogControls from './components/work-log-controls.component';
import MarkdownView from './components/markdown-view.component';
import ResultsList from './components/results-list.component';

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
		resetWorkLogs,
		setFromDate,
		setToDate,
		teams,
		loadingTeams,
		selectedTeam,
		setSelectedTeam,
		hideFreelancers,
		setHideFreelancers,
	} = useWorkLogChecker(jwt);
	const [showMarkdown, setShowMarkdown] = useState(false);

	const showClearButton = loading || employees.length > 0;

	const teamOptions = [
		{ value: '28', label: 'Team Delivery' },
		...(teams?.map(team => ({ value: team.Id.toString(), label: team.Name })) ||
			[]),
	];
	const markdownToggleDisabled = !employees.length;

	return (
		<Container>
			<Heading>Work Log Checker</Heading>
			<div className={styles.wrapper}>
				<WorkLogControls
					fromDate={fromDate}
					toDate={toDate}
					setFromDate={setFromDate}
					setToDate={setToDate}
					teamOptions={teamOptions}
					selectedTeam={selectedTeam}
					setSelectedTeam={setSelectedTeam}
					loadingTeams={loadingTeams}
					loading={loading}
					jwt={jwt}
					fetchWorkLogs={fetchWorkLogs}
					resetWorkLogs={resetWorkLogs}
					hideFreelancers={hideFreelancers}
					setHideFreelancers={setHideFreelancers}
					showMarkdown={showMarkdown}
					setShowMarkdown={setShowMarkdown}
					markdownToggleDisabled={markdownToggleDisabled}
					showClearButton={showClearButton}
				/>
			</div>

			{error && <p className={styles.error}>{error}</p>}

			{fetched && !loading && employees.length === 0 && (
				<p className={styles.noData}>No data available.</p>
			)}

			{employees.length > 0 && (
				<>
					{showMarkdown ? (
						<MarkdownView employees={employees} />
					) : (
						<ResultsList employees={employees} />
					)}
				</>
			)}
		</Container>
	);
};

export default WorkLogChecker;
