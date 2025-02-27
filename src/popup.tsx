import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { projectsSummaryService } from "./services/projects-summary/projects-summary.service";
import { checkJWT, getJWT } from "./utils/jwt.util";

const Popup = () => {
  const [jwt, setJwt] = useState<string>();

  useEffect(() => {
    checkJWT();
  }, []);

  const handleGetTokenClick = () => {
    console.log("click");
    const token = getJWT();
    console.log(token);
    if (token) {
      setJwt(token);
    }
  };

  const getProjectIncomeData = async (q: string): Promise<void> => {
    q = "page=1&filter[from]=2025-02-17&filter[to]=2025-02-23";
    const projectSummaryResponse =
      await projectsSummaryService.getProjectsSummaryResponse(q, {
        headers: {
          Authorization: jwt,
        },
      });

    console.log(projectSummaryResponse);
  };

  return (
    <>
      <h3>ITFin Helper</h3>
      <button onClick={handleGetTokenClick} id="getToken">
        Get
      </button>
      <pre id="tokenDisplay">{jwt}</pre>
      <button onClick={() => getProjectIncomeData} id="getProjectIncomeData">
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
