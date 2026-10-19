import { getFirstDayOfMonth, getLastFriday } from '../utils/date.utils';
import { useTask } from './use-task.hook';

const useProjectIncomeData = () =>
	useTask('projectIncome', () => ({
		fromDate: getFirstDayOfMonth(),
		toDate: getLastFriday(),
	}));

export default useProjectIncomeData;
