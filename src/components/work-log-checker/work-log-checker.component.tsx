import React, { useMemo, useState } from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Button from '../shared/button/button.component';
import Heading from '../shared/heading/heading.component';
import Dropdown from './components/dropdown.component';
import useWorkLogChecker from '../../hooks/use-work-log-checker.hook';
import { ButtonType } from '../shared/button/button.types';
import EmployeeCard from './components/employee-card.component';
import * as styles from './work-log-checker.module.scss';
import { formatTime } from '../../utils/format-time.util';

type Props = {
	jwt: string;
};

const classNames = styles as typeof styles & {
	checkboxesRow: string;
	copyButton: string;
};

const WorkLogChecker = ({ jwt }: Props) => {
	const [showMarkdown, setShowMarkdown] = useState(false);
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
		'idle'
	);

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

	const teamOptions = [
		{ value: '28', label: 'Team Delivery' },
		...(teams?.map(team => ({ value: team.Id.toString(), label: team.Name })) ||
			[]),
	];

	const markdownText = useMemo(() => {
		if (!employees.length) return '';

		return employees
			.map(employee => {
				const workDays = employee.Log.Data.filter(
					day => !day.isWeekend && !day.isHoliday
				);
				const totalMinutesWorked = workDays.reduce(
					(sum, day) => sum + day.MinutesInt,
					0
				);

				return `- ${employee.FirstName} ${employee.LastName} — ${formatTime(totalMinutesWorked)}`;
			})
			.join('\n');
	}, [employees]);

	const handleCopyMarkdown = async () => {
		if (!markdownText) return;

		try {
			await navigator.clipboard.writeText(markdownText);
			setCopyState('copied');
			setTimeout(() => setCopyState('idle'), 2000);
		} catch (err) {
			console.error('Failed to copy markdown', err);
			setCopyState('error');
		}
	};

	return (
		<Container>
			<Heading>Work Log Checker</Heading>
			<div className={styles.wrapper}>
				<Calendar
					fromDate={fromDate}
					toDate={toDate}
					setFromDate={setFromDate}
					setToDate={setToDate}
				/>
				<div className={styles.controlsContainer}>
					<div className={styles.teamSelector}>
						<label htmlFor="team-select">Select Team:</label>
						<Dropdown
							id="team-select"
							options={teamOptions}
							value={selectedTeam}
							onChange={value => setSelectedTeam(value)}
							disabled={loadingTeams}
							placeholder={loadingTeams ? 'Loading teams...' : 'Select a team'}
						/>
					</div>
					<div className={classNames.checkboxesRow}>
						<div className={styles.checkboxContainer}>
							<input
								type="checkbox"
								id="hide-freelancers"
								checked={hideFreelancers}
								onChange={e => setHideFreelancers(e.target.checked)}
							/>
							<label htmlFor="hide-freelancers">Hide Freelancers</label>
						</div>
						<div className={styles.checkboxContainer}>
							<input
								type="checkbox"
								id="markdown-toggle"
								checked={showMarkdown}
								onChange={e => setShowMarkdown(e.target.checked)}
								disabled={!employees.length}
							/>
							<label htmlFor="markdown-toggle">Show markdown view</label>
						</div>
					</div>
					<Button
						onClick={fetchWorkLogs}
						disabled={!jwt || loading || !selectedTeam}
						additionalProps={{
							btnType: ButtonType.TEXT,
							text: loading ? 'Fetching data...' : 'Fetch work logs',
						}}
					/>
					<Button
						onClick={resetWorkLogs}
						disabled={!jwt || !selectedTeam ? true : false}
						variant="secondary"
						additionalProps={{
							btnType: ButtonType.TEXT,
							text: 'Clear',
						}}
					/>
				</div>
			</div>

			{error && <p className={styles.error}>{error}</p>}

			{fetched && !loading && employees.length === 0 && (
				<p className={styles.noData}>No data available.</p>
			)}

			{employees.length > 0 && (
				<>
					{showMarkdown ? (
						<div className={styles.markdownContainer}>
							<div className={styles.markdownActions}>
								<span className={styles.markdownHint}>
									Copy-friendly markdown list
								</span>
								<button
									type="button"
									className={classNames.copyButton}
									onClick={handleCopyMarkdown}
									disabled={!markdownText}
								>
									{copyState === 'copied'
										? 'Copied!'
										: copyState === 'error'
											? 'Copy failed'
											: 'Copy'}
								</button>
							</div>
							<textarea
								className={styles.markdownTextarea}
								readOnly
								value={markdownText}
							/>
						</div>
					) : (
						<div className={styles.resultContainer}>
							{employees
								.map((employee, index) => {
									return <EmployeeCard key={index} employee={employee} />;
								})
								.filter(Boolean)}
						</div>
					)}
				</>
			)}
		</Container>
	);
};

export default WorkLogChecker;
