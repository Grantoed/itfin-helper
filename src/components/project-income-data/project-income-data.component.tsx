import React from "react";
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

  return (
    <>
      <label className={styles.test}>From: </label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
      />
      <br />

      <label>To: </label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
      />
      <br />

      <button
        onClick={getProjectIncomeData}
        disabled={!jwt || loading}
        style={{
          marginTop: "10px",
          padding: "8px",
          background: "#007bff",
          color: "#fff",
          border: "none",
          cursor: jwt && !loading ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Fetching Data..." : "Get Project Income Data"}
      </button>

      <pre>{progress}</pre>

      <pre>
        {loading
          ? "Fetching project income..."
          : income !== null
          ? `Total Project Income: $${income.toFixed(2)}`
          : "Project income will appear here..."}
      </pre>
    </>
  );
};

export default ProjectIncomeData;
