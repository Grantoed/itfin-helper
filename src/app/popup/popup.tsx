import React from 'react';
import Header from '../../components/header/header.component';
import ProjectIncomeData from '../../components/project-income-data/project-income-data.component';
import WorkLogChecker from '../../components/work-log-checker/work-log-checker.component';
import VacationsList from '../../components/vacations-list/vacations-list.component';
import Tabs, {
	panelId,
	Tab,
	tabId,
} from '../../components/shared/tabs/tabs.component';
import { useTaskStatus } from '../../hooks/use-task.hook';
import { PREF_KEYS } from '../../shared/constants';
import { usePersistentState } from '../../utils/store.util';
import * as styles from './popup.module.scss';

type TabId = 'income' | 'workLogs' | 'vacations';

type Props = {
	jwt: string | null;
};

const Panel = ({
	id,
	active,
	children,
}: {
	id: TabId;
	active: TabId;
	children: React.ReactNode;
}) => (
	// Inactive panels stay mounted so unsaved inputs survive tab switches
	<div
		role="tabpanel"
		id={panelId(id)}
		aria-labelledby={tabId(id)}
		hidden={id !== active}
	>
		{children}
	</div>
);

const Sections = ({ jwt }: { jwt: string }) => {
	const [active, setActive] = usePersistentState<TabId>(
		PREF_KEYS.ACTIVE_TAB,
		'income'
	);
	const tabs: Tab<TabId>[] = [
		{ id: 'income', label: 'Income', status: useTaskStatus('projectIncome') },
		{ id: 'workLogs', label: 'Work logs', status: useTaskStatus('workLogs') },
		{ id: 'vacations', label: 'Vacations', status: useTaskStatus('vacations') },
	];

	return (
		<>
			<Tabs
				tabs={tabs}
				value={active}
				onChange={id => {
					setActive(id);
					// Tabs share the page scroll; start each one at the top
					window.scrollTo(0, 0);
				}}
			/>
			<Panel id="income" active={active}>
				<ProjectIncomeData jwt={jwt} />
			</Panel>
			<Panel id="workLogs" active={active}>
				<WorkLogChecker jwt={jwt} />
			</Panel>
			<Panel id="vacations" active={active}>
				<VacationsList />
			</Panel>
		</>
	);
};

const Popup = ({ jwt }: Props) => (
	<main className={styles.container}>
		<Header isAuthed={Boolean(jwt)} />
		{jwt && <Sections jwt={jwt} />}
	</main>
);

export default Popup;
