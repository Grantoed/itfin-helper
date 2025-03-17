import React from 'react';
import {
	workProgress,
	getLastFriday,
	MONTHS,
} from '../../utils/calendar.utils';
import * as styles from './working-days-progress.module.scss';

const WorkingDaysProgress = () => {
	const formatTargetDate = () => {
		const targetDateString = getLastFriday();
		const targetDate = new Date(targetDateString);

		return `${MONTHS[targetDate.getMonth()]} ${targetDate.getDate()}`;
	};

	return (
		<section className={styles.wrapper}>
			<p className={styles.daysProgressText}>
				Working Days Progress (until {formatTargetDate()}):
				<span className={styles.daysProgress}>{` ${workProgress}`}</span>
			</p>
		</section>
	);
};

export default WorkingDaysProgress;
