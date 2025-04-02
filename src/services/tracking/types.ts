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
	'filter[from]': string;
	'filter[to]': string;
};

type HolidayData = Record<string, string[]>;

type Currency = {
	Id: number;
	OwnerId: number;
	Title: string;
	Code: string;
	Symbol: string;
	IsDefault: number;
	IsCryptoCurrency: boolean;
	Precision: number;
};

type Client = {
	Id: number;
	AccountManagerId: number;
	AccountManager2Id: number | null;
	AccountManager3Id: number | null;
	AccountManager4Id: number | null;
	AccountManager5Id: number | null;
};

type Project = {
	Id: number;
	Name: string;
	IsServicesEnabled: boolean;
	ProjectManagerId: number;
	ProjectManager2Id: number | null;
	ProjectManager3Id: number | null;
	ProjectManager4Id: number | null;
	ProjectManager5Id: number | null;
	Client: Client;
};

type ClientAgreement = {
	DateStart: string;
	DateEnd: string;
	CreatedAt: string;
	UpdatedAt: string;
	Id: number;
	ProjectId: number;
	EmployeeId: number;
	AgreementType: string;
	Type: string;
	Basis: string;
	Status: string;
	CurrencyId: number;
	SLAHours: number | null;
	Amount: number | null;
	Rate: number;
	DailyRate: number | null;
	Notes: string | null;
	Allocation: number;
	IsAllowTrackExternal: number;
	IsTimeoffCoveredByClient: boolean;
	TimeoffPercent: number;
	IsOvertimeAllocation: boolean;
	ProjectServiceId: number | null;
	CreatedBy: number;
	ApprovedBy: number | null;
	Project: Project;
	Currency: Currency;
	AgreementText: string;
	BarText: string;
	HasAccess: boolean;
};

type ContractType = {
	EmployeeId: number;
	ContractTypeId: number;
	Name: string;
	Color: string;
};

type Position = {
	Title: string;
};

type Employee = {
	DateOfEmployment: string;
	DateOfRetiring: string | null;
	AvatarUrl: string | null;
	Id: number;
	Status: string;
	FirstName: string;
	LastName: string;
	FileId: number | null;
	UserType: string;
	Country: string;
	ClientAgreements: ClientAgreement[];
	Timesheets: any[];
	Marks: any[];
	Position: Position;
	CarryOverIn: any[];
	CarryOverOut: any[];
	ContractTypes: ContractType[];
};

export type EmploymentType = {
	Data: Employee[];
	Count: number;
	Holidays: HolidayData;
};
