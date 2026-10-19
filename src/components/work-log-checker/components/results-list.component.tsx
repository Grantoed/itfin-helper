import React from 'react';
import EmployeeCard from './employee-card.component';
import * as styles from '../work-log-checker.module.scss';
import type { WorkLogSummary } from '../../../utils/work-log.utils';

type ResultsListProps = {
	summaries: WorkLogSummary[];
};

const ResultsList = ({ summaries }: ResultsListProps) => (
	<div className={styles.resultContainer}>
		{summaries.map(summary => (
			<EmployeeCard key={summary.employee.Id} summary={summary} />
		))}
	</div>
);

export default ResultsList;
