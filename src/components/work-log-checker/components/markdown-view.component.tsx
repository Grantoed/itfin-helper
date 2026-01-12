import React, { useMemo, useState } from 'react';
import * as styles from '../work-log-checker.module.scss';
import { formatTime } from '../../../utils/format-time.util';
import { EnhancedEmployeeRecord } from '../../../hooks/use-work-log-checker.hook';

const classNames = styles as typeof styles & {
	copyButton: string;
};

type MarkdownViewProps = {
	employees: EnhancedEmployeeRecord[];
};

const MarkdownView = ({ employees }: MarkdownViewProps) => {
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
		'idle'
	);

	const markdownText = useMemo(() => {
		if (!employees.length) return '';

		const WORKDAY_IN_MINUTES = 480;

		const underworkedEmployees = employees
			.map(employee => {
				const workDays = employee.Log.Data.filter(
					day => !day.isWeekend && !day.isHoliday
				);
				const totalMinutesWorked = workDays.reduce(
					(sum, day) => sum + day.MinutesInt,
					0
				);
				const expectedMinutes = workDays.length * WORKDAY_IN_MINUTES;
				const totalDeficit = expectedMinutes - totalMinutesWorked;

				if (totalDeficit <= 0) {
					return null;
				}

				return `- ${employee.FirstName} ${employee.LastName} — Underworked ${formatTime(
					totalDeficit
				)}`;
			})
			.filter((entry): entry is string => Boolean(entry));

		return underworkedEmployees.join('\n');
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
		<div className={styles.markdownContainer}>
			<div className={styles.markdownActions}>
				<span className={styles.markdownHint}>Copy-friendly markdown list</span>
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
	);
};

export default MarkdownView;
