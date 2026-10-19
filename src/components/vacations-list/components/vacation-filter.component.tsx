import React from 'react';
import { FilterType } from '../../../services/vacations/types';
import * as styles from '../vacations-list.module.scss';

type Props = {
	filterType: FilterType;
	setFilterType: (filterType: FilterType) => void;
	disabled?: boolean;
};

const OPTIONS: { value: FilterType; label: string }[] = [
	{ value: 'company', label: 'Company' },
	{ value: 'team', label: 'Team' },
];

const VacationFilter = ({ filterType, setFilterType, disabled }: Props) => (
	<div className={styles.filterContainer} role="radiogroup" aria-label="Scope">
		{OPTIONS.map(({ value, label }) => (
			<label key={value} className={styles.radioLabel}>
				<input
					type="radio"
					name="vacation-filter"
					value={value}
					checked={filterType === value}
					onChange={() => setFilterType(value)}
					disabled={disabled}
					className={styles.radioInput}
				/>
				{label}
			</label>
		))}
	</div>
);

export default VacationFilter;
