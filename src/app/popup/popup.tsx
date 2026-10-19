import React from 'react';
import Header from '../../components/header/header.component';
import ProjectIncomeData from '../../components/project-income-data/project-income-data.component';
import WorkLogChecker from '../../components/work-log-checker/work-log-checker.component';
import VacationsList from '../../components/vacations-list/vacations-list.component';
import * as styles from './popup.module.scss';

type Props = {
	jwt: string | null;
};

const Popup = ({ jwt }: Props) => (
	<main className={styles.container}>
		<Header isAuthed={Boolean(jwt)} />
		{jwt && (
			<>
				<ProjectIncomeData />
				<WorkLogChecker jwt={jwt} />
				<VacationsList />
			</>
		)}
	</main>
);

export default Popup;
