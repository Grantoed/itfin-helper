import React, { useState } from "react";
import { trackingService } from "../../services/tracking/tracking.service";
import {
  GetTrackingResponseQuery,
  EmployeeRecord,
} from "../../services/tracking/types";
import { format } from "date-fns";

type Props = {
  jwt: string;
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}h ${mins
    .toString()
    .padStart(2, "0")}m`;
};

const WorkLogChecker = ({ jwt }: Props) => {
  const [fromDate, setFromDate] = useState<string>(
    format(new Date(), "yyyy-MM-01")
  );
  const [toDate, setToDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
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
      const query: GetTrackingResponseQuery = {
        "filter[from]": fromDate,
        "filter[to]": toDate,
      };
      const data = await trackingService.getTrackingResponse(query, {
        headers: { Authorization: jwt },
      });

      setEmployees(data as EmployeeRecord[]);
    } catch (err) {
      setError("Failed to fetch work logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Work Log Checker</h2>
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={fetchWorkLogs}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Check
        </button>
      </div>
      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {fetched && !loading && employees.length === 0 && (
        <p className="text-gray-600">No data available.</p>
      )}
      <div>
        {employees
          .map((employee) => {
            const workDays = employee.Log.Data.filter(
              (day) => !day.isWeekend && !day.isHoliday
            );

            const totalMinutesWorked = workDays.reduce(
              (sum, day) => sum + day.MinutesInt,
              0
            );
            const expectedMinutes = workDays.length * 480; // 8 hours per workday
            const totalDeficit = expectedMinutes - totalMinutesWorked;

            if (totalDeficit <= 0) return null; // Ignore if no deficit

            const underworkedDays = workDays.filter(
              (day) => day.MinutesInt < 480
            );

            return (
              <div
                key={employee.Id}
                className="border p-4 my-2 rounded shadow bg-gray-50"
              >
                <h3 className="font-bold text-lg mb-2">
                  {employee.FirstName} {employee.LastName}{" "}
                  <span className="text-red-600">
                    (Underworked {formatTime(totalDeficit)})
                  </span>
                </h3>
                <ul className="list-disc list-inside">
                  {underworkedDays.map((day) => (
                    <li key={day.Date} className="text-red-600">
                      {day.Date}: {formatTime(day.MinutesInt)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
          .filter(Boolean)}
      </div>
    </div>
  );
};

export default WorkLogChecker;
