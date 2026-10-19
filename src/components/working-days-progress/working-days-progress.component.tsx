import React from 'react';
import { formatShortDate, WorkingDays } from '../../utils/date.utils';
import * as styles from './working-days-progress.module.scss';

type Props = {
	workingDays: WorkingDays;
	holidayCount: number;
};

const WorkingDaysProgress = ({
	workingDays: { passed, total, until },
	holidayCount,
}: Props) => {
	const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

	return (
		<section className={styles.wrapper}>
			<p className={styles.daysProgressText}>
				Working days progress (until {formatShortDate(until)}):
				<span className={styles.daysProgress}>
					{` ${passed}/${total} (${percent}%)`}
				</span>
				{holidayCount > 0 && (
					<span className={styles.holidayNote}>
						{` excl. ${holidayCount} public holiday${
							holidayCount > 1 ? 's' : ''
						}`}
					</span>
				)}
			</p>
		</section>
	);
};

export default WorkingDaysProgress;
