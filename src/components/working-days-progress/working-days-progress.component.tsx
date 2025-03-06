import React from 'react';
import { workProgress } from '../../utils/calendar.utils';
import * as styles from './working-days-progress.module.scss';

const WorkingDaysProgress = () => {
	return (
		<section className={styles.wrapper}>
			<p className={styles.daysProgressText}>
				Working Days Progress:
				<span className={styles.daysProgress}>{` ${workProgress}`}</span>
			</p>
		</section>
	);
};

export default WorkingDaysProgress;
