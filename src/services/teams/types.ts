export type Head = {
	Id: number;
	FirstName: string;
	LastName: string;
};

export type Team = {
	HeadAssignDate: string | null;
	CreatedAt: string;
	UpdatedAt: string;
	lft: number;
	rgt: number;
	level: number;
	parentId: number;
	rootId: number;
	Id: number;
	OwnerId: number;
	ParentId: number;
	HeadId: number;
	TeamType: 'Team' | 'Department';
	Name: string;
	GenerationType: 'ProjectsBased' | 'ManualBased';
	FinanceDataAccessType: 'NoAccess';
	IsIgnoredInApprovings: boolean;
	Lft: number;
	Rgt: number;
	Level: number;
	DeletedAt: string | null;
	CreatedBy: number;
	Head: Head;
};

export type MyTeamsResponse = Team[];
