import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { projectsSummaryService } from "./services/projects-summary/projects-summary.service";
import { getJWT } from "./utils/jwt.util";
import { ITFinResponse } from "./services/projects-summary/types";

const Popup = () => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<string>("2025-02-17");
  const [toDate, setToDate] = useState<string>("2025-02-23");

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
    setIncome(null); // Reset income before fetching new data

    try {
      // Fetch first page to get total project count
      const firstPageResponse: ITFinResponse =
        await projectsSummaryService.getProjectsSummaryResponse(
          { page: 1, "filter[from]": fromDate, "filter[to]": toDate },
          { headers: { Authorization: jwt } }
        );

      // Extract total count of projects
      const totalProjects = firstPageResponse.Count;
      const totalPages = Math.ceil(totalProjects / 25);

      // If only one page, return the calculated total immediately
      let allProjects = firstPageResponse.Projects;

      if (totalPages > 1) {
        // Create an array of promises to fetch all remaining pages
        const pageRequests = [];
        for (let page = 2; page <= totalPages; page++) {
          pageRequests.push(
            projectsSummaryService.getProjectsSummaryResponse(
              { page, "filter[from]": fromDate, "filter[to]": toDate },
              { headers: { Authorization: jwt } }
            )
          );
        }

        // Fetch all pages concurrently
        const responses: ITFinResponse[] = await Promise.all(pageRequests);

        // Combine all project data
        allProjects = [
          ...allProjects,
          ...responses.flatMap((res) => res.Projects),
        ];
      }

      // Calculate total income across all projects
      const totalIncome = allProjects.reduce(
        (sum, project) => sum + project.Income,
        0
      );

      setIncome(totalIncome);
    } catch (error) {
      console.error("Failed to fetch project income data:", error);
      setIncome(null); // Indicate failure
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

      <pre id="incomeDisplay">
        {loading
          ? "Fetching project income..."
          : income !== null
          ? `Total Project Income: $${income.toFixed(2)}`
          : "Project income will appear here..."}
      </pre>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
