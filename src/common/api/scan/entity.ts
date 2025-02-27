export interface ScanEntity {
	eventId: string;
	userId: string;
	organizerId: string;
	hackathonId?: string;
}

export interface ScanAnalyticsEntity {
	eventId: string;
	scans: ScanEntity[];
}
