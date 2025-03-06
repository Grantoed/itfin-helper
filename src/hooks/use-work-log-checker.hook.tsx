import { useState } from 'react';
import { format } from 'date-fns';
import { trackingService } from '../services/tracking/tracking.service';
import { EmployeeRecord } from '../services/tracking/types';

const useWorkLogChecker = (jwt: string) => {
	const [fromDate, setFromDate] = useState<string>(
		format(new Date(), 'yyyy-MM-01')
	);
	const [toDate, setToDate] = useState<string>(
		format(new Date(), 'yyyy-MM-dd')
	);
	const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [fetched, setFetched] = useState<boolean>(false);

	const fetchWorkLogs = async () => {
		setLoading(true);
		setError(null);
		setFetched(true);
		try {
			const query = {
				'filter[from]': fromDate,
				'filter[to]': toDate,
			};
			const data = await trackingService.getTrackingResponse(query, {
				headers: { Authorization: jwt },
			});

			setEmployees(data as EmployeeRecord[]);
		} catch (err) {
			setError('Failed to fetch work logs');
		} finally {
			setLoading(false);
		}
	};

	return {
		fromDate,
		toDate,
		employees,
		loading,
		error,
		fetched,
		fetchWorkLogs,
		setFromDate,
		setToDate,
	};
};

export default useWorkLogChecker;
