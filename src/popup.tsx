import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { projectsSummaryService } from "./services/projects-summary/projects-summary.service";
import { getJWT } from "./utils/jwt.util";
import { ITFinResponse } from "./services/projects-summary/types";

const getFirstDayOfMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
};

const getLastFriday = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = day >= 5 ? day - 5 : 7 + day - 5; // Days to subtract to get last Friday
  now.setDate(now.getDate() - diff);
  return now.toISOString().split("T")[0]; // Format YYYY-MM-DD
};

const countWorkingDays = (): { passed: number; total: number } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  let total = 0;
  let passed = 0;

  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break; // Stop when month changes

    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Exclude weekends
      total++;
      if (day <= today) passed++;
    }
  }

  return { passed, total };
};

const Popup = () => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<string>(getFirstDayOfMonth());
  const [toDate, setToDate] = useState<string>(getLastFriday());
  const [progress, setProgress] = useState<string | null>(null);

  const { passed, total } = countWorkingDays();
  const workProgress = `${passed}/${total} (${Math.round(
    (passed / total) * 100
  )}%)`;

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getJWT();
      setJwt(token?.authToken || null);
    };
    fetchToken();
  }, []);

  const getProjectIncomeData = async (): Promise<void> => {
    if (!jwt) return;

    setLoading(true);
    setIncome(null);
    setProgress("Fetching first page...");

    try {
      const firstPageResponse: ITFinResponse =
        await projectsSummaryService.getProjectsSummaryResponse(
          { page: 1, "filter[from]": fromDate, "filter[to]": toDate },
          { headers: { Authorization: jwt } }
        );

      const totalProjects = firstPageResponse.Count;
      const totalPages = Math.ceil(totalProjects / 25);
      let allProjects = firstPageResponse.Projects;

      setProgress(`Total pages: ${totalPages}. Page 1 fetched.`);

      if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          setProgress(`Fetching page ${page}/${totalPages}...`);
          const response =
            await projectsSummaryService.getProjectsSummaryResponse(
              { page, "filter[from]": fromDate, "filter[to]": toDate },
              { headers: { Authorization: jwt } }
            );
          allProjects = [...allProjects, ...response.Projects];
          setProgress(`Page ${page} fetched (${page}/${totalPages})...`);
        }
      }

      const totalIncome = allProjects.reduce(
        (sum, project) => sum + project.Income,
        0
      );
      setIncome(totalIncome);
      setProgress(`Completed! Fetched ${totalPages} pages.`);
    } catch (error) {
      console.error("Failed to fetch project income data:", error);
      setIncome(null);
      setProgress("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

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

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
