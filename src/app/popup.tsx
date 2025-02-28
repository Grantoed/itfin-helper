import React from "react";
import useProjectIncomeData from "../hooks/use-project-income-data.hook";
import useJWT from "../hooks/use-jwt.hook";
import { workProgress } from "../utils/calendar.utils";

const Popup = () => {
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

  const jwt = useJWT();

  return (
    <div style={{ padding: "10px", width: "300px", textAlign: "center" }}>
      <h3>ITFin Helper</h3>
      <p>{jwt ? "Authenticated" : "Please log in via ITFin first"}</p>

      <label>From: </label>
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

      <pre>Working Days Progress: {workProgress}</pre>
    </div>
  );
};

export default Popup;
