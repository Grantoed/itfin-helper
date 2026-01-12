import React from 'react';
import EmployeeCard from './employee-card.component';
import * as styles from '../work-log-checker.module.scss';
import { EnhancedEmployeeRecord } from '../../../hooks/use-work-log-checker.hook';

type ResultsListProps = {
	employees: EnhancedEmployeeRecord[];
};

const ResultsList = ({ employees }: ResultsListProps) => {
	if (!employees.length) return null;

	return (
		<div className={styles.resultContainer}>
			{employees.map((employee, index) => (
				<EmployeeCard key={index} employee={employee} />
			))}
		</div>
	);
};

export default ResultsList;
