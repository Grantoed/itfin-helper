import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { projectsSummaryService } from "./services/projects-summary/projects-summary.service";
import { getJWT } from "./utils/jwt.util";

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

    const q = {
      page: 1,
      "filter[from]": "2025-02-17",
      "filter[to]": "2025-02-23",
    };

    try {
      const projectSummaryResponse =
        await projectsSummaryService.getProjectsSummaryResponse(q, {
          headers: {
            Authorization: jwt,
          },
        });

      console.log(projectSummaryResponse);
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
