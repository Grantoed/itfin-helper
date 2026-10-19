import React, { useEffect, useState } from 'react';
import { PREF_KEYS } from '../../../shared/constants';
import type { WorkingDays } from '../../../utils/date.utils';
import {
	calculateIncomeProgress,
	formatPercent,
	formatUsd,
	parseAmount,
} from '../../../utils/income.utils';
import { usePersistentState } from '../../../utils/store.util';
import ResultsHeader from '../../shared/copy-button/results-header.component';
import * as styles from '../project-income-data.module.scss';

type Props = {
	income: number;
	month: string; // 'YYYY-MM'
	workingDays: WorkingDays;
};

// Planned income comes from the team's Google Sheet; it is typed in once per
// month and the rest of the meeting figures are derived from it.
const IncomeProgress = ({ income, month, workingDays }: Props) => {
	const [planned, setPlanned] = usePersistentState<number | null>(
		`${PREF_KEYS.PLANNED_INCOME}:${month}`,
		null
	);
	const [draft, setDraft] = useState(planned?.toString() ?? '');

	// Follow the stored value when the month changes
	useEffect(() => setDraft(planned?.toString() ?? ''), [month]);

	const handleChange = (value: string) => {
		setDraft(value);
		setPlanned(parseAmount(value));
	};

	const { workingDaysRatio, expected, progressRatio } = calculateIncomeProgress(
		planned ?? 0,
		income,
		workingDays
	);
	const workingDaysText = `${workingDays.passed}/${
		workingDays.total
	} (${formatPercent(workingDaysRatio)})`;

	const copyText = planned
		? [
				`Planned Income ${formatUsd(planned, 0)}`,
				`Working days progress: ${formatPercent(workingDaysRatio)}`,
				`Expected earned Income ${formatPercent(
					workingDaysRatio
				)} x ${formatUsd(planned, 0)} = ${formatUsd(expected, 0)}`,
				`Progress ${formatUsd(income, 0)} (${
					progressRatio === null ? '—' : formatPercent(progressRatio)
				})`,
		  ].join('\n')
		: '';

	return (
		<div className={styles.progressBlock}>
			<ResultsHeader copyText={copyText}>Monthly progress</ResultsHeader>
			<label className={styles.plannedRow}>
				<span className={styles.metaLabel}>Planned income</span>
				<span className={styles.plannedInput}>
					$
					<input
						type="text"
						inputMode="decimal"
						placeholder="Type here…"
						value={draft}
						onChange={event => handleChange(event.target.value)}
					/>
				</span>
			</label>

			<dl className={styles.figures}>
				<dt>Working days</dt>
				<dd>{workingDaysText}</dd>
				{planned ? (
					<>
						<dt>Expected earned</dt>
						<dd>
							{formatPercent(workingDaysRatio)} × {formatUsd(planned, 0)} ={' '}
							<strong>{formatUsd(expected, 0)}</strong>
						</dd>
						<dt>Progress</dt>
						<dd>
							<strong>{formatUsd(income, 0)}</strong>
							{progressRatio !== null && (
								<span
									className={progressRatio >= 1 ? styles.ahead : styles.behind}
								>
									{' '}
									({formatPercent(progressRatio)})
								</span>
							)}
						</dd>
					</>
				) : null}
			</dl>
		</div>
	);
};

export default IncomeProgress;
