import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { parseISODate, toISODate } from '../../utils/date.utils';
import * as styles from './calendar.module.scss';

type DateRange = [Date | null, Date | null];

type Props = {
	fromDate: string;
	toDate: string;
	onChange: (fromDate: string, toDate: string) => void;
	disabled?: boolean;
};

const Calendar = ({ fromDate, toDate, onChange, disabled }: Props) => {
	// Holds a half-picked range; the parent only sees complete ranges
	const [draft, setDraft] = useState<DateRange | null>(null);
	const [start, end] = draft ?? [parseISODate(fromDate), parseISODate(toDate)];

	const handleChange = ([nextStart, nextEnd]: DateRange) => {
		if (nextStart && nextEnd) {
			setDraft(null);
			onChange(toISODate(nextStart), toISODate(nextEnd));
		} else {
			setDraft([nextStart, nextEnd]);
		}
	};

	return (
		<DatePicker
			className={styles.datePicker}
			calendarClassName={styles.calendar}
			selected={start}
			startDate={start}
			endDate={end}
			onChange={handleChange}
			// Abandon an unfinished selection instead of leaving half a range
			onCalendarClose={() => setDraft(null)}
			selectsRange
			disabled={disabled}
			dateFormat="dd/MM/yyyy"
			placeholderText="Select date range"
			calendarStartDay={1}
		/>
	);
};

export default Calendar;
