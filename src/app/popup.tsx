import React from "react";
import Header from "../components/header/header.component";
import WorkingDaysProgress from "../components/working-days-progress/working-days-progress.component";
import ProjectIncomeData from "../components/project-income-data/project-income-data.component";
import WorkLogChecker from "../components/work-log-checker/work-log-checker.component";
import useJWT from "../hooks/use-jwt.hook";

const Popup = () => {
  const jwt = useJWT();

  return (
    <div style={{ padding: "10px", width: "300px", textAlign: "center" }}>
      <Header jwt={jwt} />
      <ProjectIncomeData jwt={jwt} />
      <WorkLogChecker jwt={jwt} />
      <WorkingDaysProgress />
    </div>
  );
};

export default Popup;
