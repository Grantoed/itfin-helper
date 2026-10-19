import { PREF_KEYS } from '../shared/constants';
import type { FilterType } from '../services/vacations/types';
import { addDays, getToday } from '../utils/date.utils';
import { getStorageValue, setStorageValue } from '../utils/store.util';
import { useTask } from './use-task.hook';

// The weekly meeting looks at time off coming up in the next two weeks
const UPCOMING_DAYS = 14;

const useVacationsList = () => {
	const task = useTask('vacations', () => ({
		fromDate: getToday(),
		toDate: addDays(getToday(), UPCOMING_DAYS - 1),
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
