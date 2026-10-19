import React from 'react';
import { FilterType } from '../../../services/vacations/types';
import * as styles from '../vacations-list.module.scss';

type Props = {
	filterType: FilterType;
	setFilterType: (filterType: FilterType) => void;
	disabled?: boolean;
};

// Same labels as ITFin's calendar switch
const OPTIONS: { value: FilterType; label: string }[] = [
	{ value: 'company', label: 'The Company' },
	{ value: 'team', label: 'My Team' },
];

// Radio group drawn as ITFin's segmented control
const VacationFilter = ({ filterType, setFilterType, disabled }: Props) => (
	<div className={styles.segmented} role="radiogroup" aria-label="Scope">
		{OPTIONS.map(({ value, label }) => (
			<label
				key={value}
				className={
					filterType === value ? styles.segmentSelected : styles.segment
				}
			>
				<input
					type="radio"
					name="vacation-filter"
					value={value}
					checked={filterType === value}
					onChange={() => setFilterType(value)}
					disabled={disabled}
					className="visually-hidden"
				/>
				{label}
			</label>
		))}
	</div>
);

export default VacationFilter;
