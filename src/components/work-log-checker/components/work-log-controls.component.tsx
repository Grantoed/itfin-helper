import React from 'react';
import Calendar from '../../calendar/calendar.component';
import Dropdown, { DropdownOption } from './dropdown.component';
import * as styles from '../work-log-checker.module.scss';

type WorkLogControlsProps = {
	fromDate: string;
	toDate: string;
	onDatesChange: (fromDate: string, toDate: string) => void;
	teamOptions: DropdownOption[];
	selectedTeam: string;
	setSelectedTeam: (teamId: string) => void;
	loadingTeams: boolean;
	loading: boolean;
	hideFreelancers: boolean;
	setHideFreelancers: (value: boolean) => void;
	showMarkdown: boolean;
	setShowMarkdown: (value: boolean) => void;
	markdownToggleDisabled: boolean;
};

const WorkLogControls = ({
	fromDate,
	toDate,
	onDatesChange,
	teamOptions,
	selectedTeam,
	setSelectedTeam,
	loadingTeams,
	loading,
	hideFreelancers,
	setHideFreelancers,
	showMarkdown,
	setShowMarkdown,
	markdownToggleDisabled,
}: WorkLogControlsProps) => {
	// A saved team may have disappeared from the list; keep it selectable
	const options = teamOptions.some(option => option.value === selectedTeam)
		? teamOptions
		: [...teamOptions, { value: selectedTeam, label: `Team #${selectedTeam}` }];

	return (
		<>
			<Calendar
				fromDate={fromDate}
				toDate={toDate}
				onChange={onDatesChange}
				disabled={loading}
			/>
			<div className={styles.controlsContainer}>
				<div className={styles.teamSelector}>
					<label htmlFor="team-select">Team</label>
					<Dropdown
						id="team-select"
						options={options}
						value={selectedTeam}
						onChange={setSelectedTeam}
						disabled={loading || loadingTeams}
						placeholder={loadingTeams ? 'Loading teams...' : 'Select a team'}
					/>
				</div>
				<div className={styles.checkboxesRow}>
					<div className={styles.checkboxContainer}>
						<input
							type="checkbox"
							id="hide-freelancers"
							checked={hideFreelancers}
							onChange={e => setHideFreelancers(e.target.checked)}
						/>
						<label htmlFor="hide-freelancers">Hide freelancers</label>
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
			</div>
		</>
	);
};

export default WorkLogControls;
