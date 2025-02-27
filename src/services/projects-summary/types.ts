export type ClientAgreement = {
  DateStart: string;
  DateEnd: string;
  CreatedAt: string;
  UpdatedAt: string;
  Id: number;
  ProjectId: number;
  EmployeeId: number;
  AgreementType: string;
  Type: string;
  Status: string;
  CurrencyId: number;
  SLAHours: number | null;
  Amount: number | null;
  Rate: number | null;
  DailyRate: number | null;
  Notes: string | null;
  Allocation: number;
  IsAllowTrackExternal: number;
  IsTimeoffCoveredByClient: boolean;
  TimeoffPercent: number;
  IsOvertimeAllocation: boolean;
  ProjectServiceId: number | null;
  CreatedBy: number;
  ApprovedBy: number;
};

export type Employee = {
  AvatarUrl: string;
  Id: number;
  FirstName: string;
  LastName: string;
  FileId: number;
  ClientAgreements: ClientAgreement[];
  FTE: number;
  Net: number;
  ForecastIncome: number;
  RateInt: number;
  RateExt: number;
  ForecastGross: number;
  ForecastGrossVacations: number;
  Gross: number;
  GrossAndSupport: number;
  HoursInt: number;
  HoursExt: number;
  Income: number;
  errorInAgreements: any[];
  FTEFunc: string;
  NetFunc: string;
};

export type ProjectManager = {
  AvatarUrl: string;
  Id: number;
  FirstName: string;
  LastName: string;
  FileId: number;
};

export type Project = {
  Id: number;
  Name: string;
  ProjectType: string;
  WithScopeOfWork: number;
  ProjectManager: ProjectManager;
  ProjectManagerName: string;
  Employees: Employee[];
  Milestones: any | null;
  FTE: number;
  ForecastIncome: number;
  ForecastGross: number;
  HoursInt: number;
  HoursExt: number;
  Net: number;
  Gross: number;
  Income: number;
  IncomeLoss: number;
  GrossAndSupport: number;
  MilestonesPrice: number;
  Profit: number;
  ProfitPercent: number;
};

export type ITFinResponse = {
  Projects: Project[];
  Count: number;
  daysInPeriod: string[];
};

export type GetProjectsSummaryResponseQuery = {
  page: number;
  "filter[from]": string;
  "filter[to]": string;
};
