import { getFirstDayOfMonth, getLastWeekendEnd } from '../utils/date.utils';
import { useTask } from './use-task.hook';

const useProjectIncomeData = () =>
	useTask('projectIncome', () => ({
		fromDate: getFirstDayOfMonth(),
		toDate: getLastWeekendEnd(),
	}));

export default useProjectIncomeData;
