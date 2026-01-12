import React, { Dispatch, SetStateAction } from 'react';
import Calendar from '../../calendar/calendar.component';
import Button from '../../shared/button/button.component';
import { ButtonType } from '../../shared/button/button.types';
import Dropdown from './dropdown.component';
import * as styles from '../work-log-checker.module.scss';

const classNames = styles as typeof styles & {
	checkboxesRow: string;
};

type TeamOption = {
	value: string;
	label: string;
};

type WorkLogControlsProps = {
	fromDate: string;
	toDate: string;
	setFromDate: Dispatch<SetStateAction<string>>;
	setToDate: Dispatch<SetStateAction<string>>;
	teamOptions: TeamOption[];
	selectedTeam?: string;
	setSelectedTeam: Dispatch<SetStateAction<string>>;
	loadingTeams: boolean;
	loading: boolean;
	jwt: string;
	fetchWorkLogs: () => void;
	resetWorkLogs: () => void;
	hideFreelancers: boolean;
	setHideFreelancers: Dispatch<SetStateAction<boolean>>;
	showMarkdown: boolean;
	setShowMarkdown: Dispatch<SetStateAction<boolean>>;
	markdownToggleDisabled: boolean;
	showClearButton: boolean;
};

const WorkLogControls = ({
	fromDate,
	toDate,
	setFromDate,
	setToDate,
	teamOptions,
	selectedTeam,
	setSelectedTeam,
	loadingTeams,
	loading,
	jwt,
	fetchWorkLogs,
	resetWorkLogs,
	hideFreelancers,
	setHideFreelancers,
	showMarkdown,
	setShowMarkdown,
	markdownToggleDisabled,
	showClearButton,
}: WorkLogControlsProps) => {
	return (
		<>
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
							disabled={markdownToggleDisabled}
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
				{showClearButton && (
					<Button
						onClick={resetWorkLogs}
						disabled={!jwt || !selectedTeam ? true : false}
						variant="secondary"
						additionalProps={{
							btnType: ButtonType.TEXT,
							text: 'Clear',
						}}
					/>
				)}
			</div>
		</>
	);
};

export default WorkLogControls;
