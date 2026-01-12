import React, { useMemo, useState } from 'react';
import Calendar from '../calendar/calendar.component';
import Container from '../shared/container/container.component';
import Button from '../shared/button/button.component';
import Heading from '../shared/heading/heading.component';
import VacationFilter from './components/vacation-filter.component';
import VacationEvent from './components/vacation-event.component';
import useVacationChecker from '../../hooks/use-vacations-list.hook';
import { ButtonType } from '../shared/button/button.types';
import * as styles from './vacations-list.module.scss';
import { formatDateRange } from '../../utils/calendar.utils';

type Props = {
	jwt: string;
};

const classNames = styles as typeof styles & {
	filterRow: string;
	toggleContainer: string;
	markdownContainer: string;
	markdownActions: string;
	markdownHint: string;
	copyButton: string;
	markdownTextarea: string;
};

const calculateDuration = (startDate: string, endDate: string): number => {
	const start = new Date(startDate);
	const end = new Date(endDate);

	const startUTC = new Date(
		Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
	);
	const endUTC = new Date(
		Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
	);

	const diffTime = endUTC.getTime() - startUTC.getTime();
	const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

	return diffDays;
};

const VacationsList = ({ jwt }: Props) => {
	const [showMarkdown, setShowMarkdown] = useState(false);
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
		'idle'
	);

	const {
		fromDate,
		toDate,
		vacations,
		loading,
		error,
		fetched,
		filterType,
		fetchVacations,
		resetVacations,
		setFromDate,
		setToDate,
		setFilterType,
	} = useVacationChecker(jwt);
	const showClearButton = loading || vacations.length > 0;

	const markdownText = useMemo(() => {
		if (!vacations.length) return '';

		return vacations
			.map(event => {
				const duration = calculateDuration(event.StartDate, event.EndDate);
				const dateText = formatDateRange(event.StartDate, event.EndDate);

				return `- ${event.Entity.FirstName} ${event.Entity.LastName} (${event.EventType}), ${dateText} – ${duration} days`;
			})
			.join('\n');
	}, [vacations]);

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
			<Heading>Vacations</Heading>

			<div className={styles.wrapper}>
				<Calendar
					fromDate={fromDate}
					toDate={toDate}
					setFromDate={setFromDate}
					setToDate={setToDate}
				/>
				<div className={classNames.filterRow}>
					<VacationFilter
						filterType={filterType}
						setFilterType={setFilterType}
					/>
					<div className={classNames.toggleContainer}>
						<input
							type="checkbox"
							id="markdown-toggle-vacations"
							checked={showMarkdown}
							onChange={e => setShowMarkdown(e.target.checked)}
							disabled={!vacations.length}
						/>
						<label htmlFor="markdown-toggle-vacations">
							Show markdown view
						</label>
					</div>
				</div>
				<Button
					onClick={fetchVacations}
					disabled={loading}
					additionalProps={{
						btnType: ButtonType.TEXT,
						text: loading ? 'Fetching data...' : 'Fetch vacations',
					}}
				/>
				{showClearButton && (
					<Button
						onClick={resetVacations}
						disabled={false}
						variant="secondary"
						additionalProps={{
							btnType: ButtonType.TEXT,
							text: 'Clear',
						}}
					/>
				)}
			</div>

			{error && <p className={styles.error}>{error}</p>}

			{fetched && !loading && vacations.length === 0 && (
				<p className={styles.noData}>No time off scheduled for this period.</p>
			)}

			{vacations.length > 0 && (
				<>
					{showMarkdown ? (
						<div className={classNames.markdownContainer}>
							<div className={classNames.markdownActions}>
								<span className={classNames.markdownHint}>
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
								className={classNames.markdownTextarea}
								readOnly
								value={markdownText}
							/>
						</div>
					) : (
						<div className={styles.resultContainer}>
							{vacations.map(event => (
								<VacationEvent key={event.RefId} event={event} />
							))}
						</div>
					)}
				</>
			)}
		</Container>
	);
};

export default VacationsList;
