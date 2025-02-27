export interface HackathonEntity {
	id: string;
	name: string;
	startTime: number;
	endTime: number;
	active: boolean;
}

export interface HackathonCreateEntity {
	name: string;
	startTime: number;
	endTime: number;
}

export type HackathonUpdateEntity = Partial<HackathonCreateEntity>;

export interface HackathonCheckInResponse {
	checkInId?: string;
}

export interface ConditionalHackathonResponse extends HackathonEntity {
	checkInId?: string;
}

export interface StaticEventLocationEntity {
	id: number;
	name: string;
}

export interface StaticEventEntity {
	id: string;
	name: string;
	type: string;
	startTime: number;
	endTime: number;
	location: StaticEventLocationEntity;
}

export interface StaticActiveHackathonEntity extends HackathonEntity {
	events: StaticEventEntity[];
	sponsors: { id: string; name: string }[];
}
