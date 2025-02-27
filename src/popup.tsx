import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { projectsSummaryService } from "./services/projects-summary/projects-summary.service";
import { getJWT } from "./utils/jwt.util";
import { ITFinResponse } from "./services/projects-summary/types";

const Popup = () => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getJWT();
      setJwt(token?.authToken || null);
      setLoading(false);
    };
    fetchToken();
  }, []);

  const getProjectIncomeData = async (): Promise<void> => {
    if (!jwt) return;

    try {
      // Fetch first page to get total project count
      const firstPageResponse: ITFinResponse =
        await projectsSummaryService.getProjectsSummaryResponse(
          { page: 1, "filter[from]": "2025-02-17", "filter[to]": "2025-02-23" },
          { headers: { Authorization: jwt } }
        );

      // Extract total count of projects
      const totalProjects = firstPageResponse.Count;
      const totalPages = Math.ceil(totalProjects / 25);

      // If only one page, return the calculated total immediately
      if (totalPages === 1) {
        const totalIncome = firstPageResponse.Projects.reduce(
          (sum, project) => sum + project.Income,
          0
        );
        console.log("Total Project Income:", totalIncome);
        return;
      }

      // Create an array of promises to fetch all remaining pages
      const pageRequests = [];
      for (let page = 2; page <= totalPages; page++) {
        pageRequests.push(
          projectsSummaryService.getProjectsSummaryResponse(
            { page, "filter[from]": "2025-02-17", "filter[to]": "2025-02-23" },
            { headers: { Authorization: jwt } }
          )
        );
      }

      // Fetch all pages concurrently
      const responses: ITFinResponse[] = await Promise.all(pageRequests);

      // Combine all project data
      const allProjects = [
        ...firstPageResponse.Projects,
        ...responses.flatMap((res) => res.Projects),
      ];

      // Calculate total income across all projects
      const totalIncome = allProjects.reduce(
        (sum, project) => sum + project.Income,
        0
      );

      console.log("Total Project Income:", totalIncome);
    } catch (error) {
      console.error("Failed to fetch project income data:", error);
    }
  };

  return (
    <>
      <h3>ITFin Helper</h3>
      <pre id="tokenDisplay">
        {loading ? "Loading..." : jwt ? jwt : "Please log in via ITFin first"}
      </pre>
      <button
        onClick={getProjectIncomeData}
        id="getProjectIncomeData"
        disabled={!jwt}
      >
        Get Project Income Data
      </button>
      <pre id="incomeDisplay">Project income will appear here...</pre>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
