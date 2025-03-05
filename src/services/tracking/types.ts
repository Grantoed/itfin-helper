export type WorkLogEntry = {
  MinutesInt: number;
  MinutesExt: number;
  Type: string;
};

export type DailyLog = {
  Date: string;
  isHoliday: boolean;
  isWeekend: boolean;
  MinutesInt: number;
  MinutesExt: number;
  log: WorkLogEntry[];
};

export type WorkLog = {
  Data: DailyLog[];
  TotalInt: number;
  TotalExt: number;
};

export type EmployeeRecord = {
  DateOfEmployment: string; // ISO date string
  DateOfRetiring: string | null;
  AvatarUrl: string;
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  BusinessHours: number;
  Log: WorkLog;
};

export type GetTrackingResponseQuery = {
  "filter[from]": string;
  "filter[to]": string;
};
