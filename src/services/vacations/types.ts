type EventType = 'Weekend' | 'Vacation' | 'Unpaid' | 'Birthday';

interface BaseEvent {
	Date: string;
	Name: string;
	EventType: EventType;
	RefEntity: string | null;
	RefId: number | null;
}

interface WeekendEvent extends BaseEvent {
	EventType: 'Weekend';
	RefEntity: null;
	RefId: null;
}

export interface TimeoffEvent extends BaseEvent {
	EventType: 'Vacation' | 'Unpaid';
	RefEntity: 'Timeoff';
	RefId: number;
	StartDate: string;
	EndDate: string;
	Entity: {
		AvatarUrl: string;
		Id: number;
		FirstName: string;
		LastName: string;
		FileId: number;
	};
}

interface BirthdayEntity {
	DateOfBirth: string;
	AvatarUrl: string;
	Id: number;
	FirstName: string;
	LastName: string;
	FileId: number;
	SortEvent: string;
	EventColumn: string;
	Sex: 'Male' | 'Female' | 'Other';
}

interface BirthdayEvent extends BaseEvent {
	EventType: 'Birthday';
	RefEntity: 'Employee';
	RefId: number;
	Entity: BirthdayEntity;
	Description: string;
}

export type FilterType = 'company' | 'team';

export type CalendarEvent = WeekendEvent | TimeoffEvent | BirthdayEvent;

export type GetVacationsResponseQuery = {
	date: string;
	'filter[type]': FilterType;
};
