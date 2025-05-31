export interface CheckInLogEntry {
	scanId: string;
	userEmail: string;
	userName: string;
	eventName: string;
	organizerEmail: string;
	organizerName: string;
	timestamp: number;
	hackathonId?: string;
}
