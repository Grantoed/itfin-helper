import React from 'react';
import * as styles from '../work-log-checker.module.scss';

export type DropdownOption = {
	value: string;
	label: string;
};

type Props = {
	id?: string;
	options: DropdownOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

const Dropdown = ({
	id,
	options,
	value,
	onChange,
	placeholder = 'Select an option',
	disabled = false,
	className,
}: Props) => {
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		onChange(event.target.value);
	};

	return (
		<div className={`${styles.container} ${className || ''}`}>
			<select
				id={id}
				className={styles.select}
				value={value}
				onChange={handleChange}
				disabled={disabled}
				aria-label={placeholder}
			>
				<option value="" disabled>
					{placeholder}
				</option>
				{options.map(option => {
					console.log(option);
					return (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					);
				})}
			</select>
			<div className={styles.arrow}>
				<svg
					width="10"
					height="6"
					viewBox="0 0 10 6"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1 1L5 5L9 1"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
		</div>
	);
};

export default Dropdown;
