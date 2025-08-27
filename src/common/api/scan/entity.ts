export interface ScanEntity {
	eventId: string;
	userId: string;
	organizerId: string;
	hackathonId?: string;
	timestamp?: string;
}

export interface ScanAnalyticsEntity {
	eventId: string;
	scans: ScanEntity[];
}
