import React from 'react';
import Header from '../../components/header/header.component';
import ProjectIncomeData from '../../components/project-income-data/project-income-data.component';
import WorkLogChecker from '../../components/work-log-checker/work-log-checker.component';
import VacationsList from '../../components/vacations-list/vacations-list.component';
import WorkingDaysProgress from '../../components/working-days-progress/working-days-progress.component';
import useJWT from '../../hooks/use-jwt.hook';
import * as styles from './popup.module.scss';

const Popup = () => {
	const jwt = useJWT();

	return (
		<div className={styles.container}>
			<Header jwt={jwt} />
			{jwt && <ProjectIncomeData jwt={jwt} />}
			{jwt && <WorkLogChecker jwt={jwt} />}
			{jwt && <VacationsList jwt={jwt} />}
			<WorkingDaysProgress />
		</div>
	);
};

export default Popup;
