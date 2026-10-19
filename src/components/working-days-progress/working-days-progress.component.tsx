import React from 'react';
import { countWorkingDays, formatShortDate } from '../../utils/date.utils';
import * as styles from './working-days-progress.module.scss';

const WorkingDaysProgress = () => {
	const { passed, total, until } = countWorkingDays();
	const percent = Math.round((passed / total) * 100);

	return (
		<section className={styles.wrapper}>
			<p className={styles.daysProgressText}>
				Working days progress (until {formatShortDate(until)}):
				<span className={styles.daysProgress}>
					{` ${passed}/${total} (${percent}%)`}
				</span>
			</p>
		</section>
	);
};

export default WorkingDaysProgress;
