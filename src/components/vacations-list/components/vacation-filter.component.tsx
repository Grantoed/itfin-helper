import React from 'react';
import { FilterType } from '../../../services/vacations/types';
import * as styles from '../vacations-list.module.scss';

type Props = {
	filterType: FilterType;
	setFilterType: React.Dispatch<React.SetStateAction<FilterType>>;
};

const VacationFilter = ({ filterType, setFilterType }: Props) => {
	return (
		<div className={styles.filterContainer}>
			<label className={styles.radioLabel}>
				<input
					type="radio"
					name="filterType"
					value="company"
					checked={filterType === 'company'}
					onChange={() => setFilterType('company')}
					className={styles.radioInput}
				/>
				Company
			</label>
			<label className={styles.radioLabel}>
				<input
					type="radio"
					name="filterType"
					value="team"
					checked={filterType === 'team'}
					onChange={() => setFilterType('team')}
					className={styles.radioInput}
				/>
				Team
			</label>
		</div>
	);
};

export default VacationFilter;
