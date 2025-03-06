import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import * as styles from './calendar.module.scss';

type Props = {
	fromDate: string;
	toDate: string;
	setFromDate: React.Dispatch<React.SetStateAction<string>>;
	setToDate: React.Dispatch<React.SetStateAction<string>>;
};

const Calendar = ({ fromDate, toDate, setFromDate, setToDate }: Props) => {
	const [dates, setDates] = useState<[Date | null, Date | null]>([
		fromDate ? new Date(fromDate) : null,
		toDate ? new Date(toDate) : null,
	]);

	const handleDateChange = (date: [Date | null, Date | null]) => {
		setDates(date);
		if (date[0]) setFromDate(date[0].toISOString().split('T')[0]);
		if (date[1]) setToDate(date[1].toISOString().split('T')[0]);
	};

	return (
		<DatePicker
			className={styles.datePicker}
			selected={dates[0]}
			onChange={(update: [Date | null, Date | null]) =>
				handleDateChange(update)
			}
			calendarClassName={styles.calendar}
			selectsRange
			startDate={dates[0]}
			endDate={dates[1]}
			dateFormat="dd/MM/yyyy"
			placeholderText="Select Date Range"
		/>
	);
};

export default Calendar;
