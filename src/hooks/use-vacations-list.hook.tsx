import { PREF_KEYS } from '../shared/constants';
import type { FilterType } from '../services/vacations/types';
import { getFirstDayOfMonth, getToday } from '../utils/date.utils';
import { getStorageValue, setStorageValue } from '../utils/store.util';
import { useTask } from './use-task.hook';

const useVacationsList = () => {
	const task = useTask('vacations', () => ({
		fromDate: getFirstDayOfMonth(),
		toDate: getToday(),
		filterType:
			getStorageValue<FilterType>(PREF_KEYS.VACATION_FILTER) ?? 'company',
	}));

	const setFilterType = (filterType: FilterType) => {
		task.setParams(params => ({ ...params, filterType }));
		setStorageValue(PREF_KEYS.VACATION_FILTER, filterType);
	};

	return { ...task, setFilterType };
};

export default useVacationsList;
