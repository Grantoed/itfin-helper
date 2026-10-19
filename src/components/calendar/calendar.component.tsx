import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { formatDate, parseISODate, toISODate } from '../../utils/date.utils';
import * as styles from './calendar.module.scss';

type DateRange = [Date | null, Date | null];

type Props = {
	fromDate: string;
	toDate: string;
	onChange: (fromDate: string, toDate: string) => void;
	disabled?: boolean;
};

// Space kept below the open calendar
const POPUP_MARGIN = 12;

// Date range field with a calendar dropdown. The calendar is positioned here
// rather than by react-datepicker's popper: Chrome sizes the extension popup
// to its content and clips anything floating outside it, so while the
// calendar is open the page is given just enough height to show it, without
// moving any content.
const Calendar = ({ fromDate, toDate, onChange, disabled }: Props) => {
	const [open, setOpen] = useState(false);
	// Holds a half-picked range; the parent only sees complete ranges
	const [draft, setDraft] = useState<DateRange | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	const [start, end] = draft ?? [parseISODate(fromDate), parseISODate(toDate)];

	const close = (refocus = false) => {
		setOpen(false);
		setDraft(null);
		if (refocus) triggerRef.current?.focus();
	};

	const handleChange = ([nextStart, nextEnd]: DateRange) => {
		if (nextStart && nextEnd) {
			onChange(toISODate(nextStart), toISODate(nextEnd));
			close(true);
		} else {
			setDraft([nextStart, nextEnd]);
		}
	};

	// Close on Escape or a click outside
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) close();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close(true);
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	// Grow the page (and so the popup) only while the calendar needs it
	useLayoutEffect(() => {
		if (!open || !dropdownRef.current) return;
		const bottom =
			dropdownRef.current.getBoundingClientRect().bottom + window.scrollY;
		document.body.style.minHeight = `${Math.ceil(bottom + POPUP_MARGIN)}px`;
		return () => {
			document.body.style.minHeight = '';
		};
	}, [open]);

	useEffect(() => {
		if (disabled) close();
	}, [disabled]);

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				type="button"
				ref={triggerRef}
				className={styles.datePicker}
				onClick={() => (open ? close() : setOpen(true))}
				disabled={disabled}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-label={`Date range: ${formatDate(fromDate)} to ${formatDate(
					toDate
				)}`}
			>
				{formatDate(fromDate)} – {formatDate(toDate)}
				<svg
					className={styles.icon}
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<rect
						x="1.5"
						y="2.5"
						width="13"
						height="12"
						rx="2"
						stroke="currentColor"
					/>
					<path d="M1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" />
				</svg>
			</button>
			{open && (
				<div
					className={styles.dropdown}
					ref={dropdownRef}
					role="dialog"
					aria-label="Choose a date range"
				>
					<DatePicker
						inline
						selectsRange
						selected={start}
						startDate={start}
						endDate={end}
						openToDate={start ?? undefined}
						onChange={handleChange}
						calendarStartDay={1}
						calendarClassName={styles.calendar}
					/>
					<p className={styles.hint}>
						{draft?.[0] ? 'Now pick the end date' : 'Pick the start date'}
					</p>
				</div>
			)}
		</div>
	);
};

export default Calendar;
