import React, { useState } from "react";
import DatePicker from "react-datepicker";
import Button from "../button/button.component";
import { ButtonType } from "../button/button.types";
import useProjectIncomeData from "../../hooks/use-project-income-data.hook";
import * as styles from "./project-income-data.module.scss";

type Props = {
  jwt: string;
};

const ProjectIncomeData = ({ jwt }: Props) => {
  const {
    getProjectIncomeData,
    loading,
    income,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    progress,
  } = useProjectIncomeData();

  const [dates, setDates] = useState<[Date | null, Date | null]>([
    fromDate ? new Date(fromDate) : null,
    toDate ? new Date(toDate) : null,
  ]);

  const handleDateChange = (date: [Date | null, Date | null]) => {
    setDates(date);
    if (date[0]) setFromDate(date[0].toISOString().split("T")[0]);
    if (date[1]) setToDate(date[1].toISOString().split("T")[0]);
  };

  return (
    <div className={styles.container}>
      <DatePicker
        className={styles.datePicker}
        selected={dates[0]}
        onChange={(update: [Date | null, Date | null]) =>
          handleDateChange(update)
        }
        selectsRange
        startDate={dates[0]}
        endDate={dates[1]}
        dateFormat="dd/MM/yyyy"
        placeholderText="Select Date Range"
      />

      <Button
        onClick={getProjectIncomeData}
        loading={loading}
        disabled={!jwt || loading}
        additionalProps={{
          btnType: ButtonType.TEXT,
          text: loading ? "Fetching Data..." : "Get Project Income Data",
        }}
      />
      <pre>{progress}</pre>

      <pre>
        {loading
          ? "Fetching project income..."
          : income !== null
          ? `Total Project Income: $${income.toFixed(2)}`
          : "Project income will appear here..."}
      </pre>
    </div>
  );
};

export default ProjectIncomeData;
