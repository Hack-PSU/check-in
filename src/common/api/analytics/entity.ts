export interface CountsResponse {
	count: number;
}

export interface RegistrationCounts extends CountsResponse {
	id: string;
	name: string;
}

export interface GenderCounts extends CountsResponse {
	gender: string;
}

export interface RaceCounts extends CountsResponse {
	race: string;
}

export interface AcademicYearCounts extends CountsResponse {
	academicYear: string;
}

export interface CodingExpCounts extends CountsResponse {
	codingExperience: string;
}

export interface AnalyticsSummaryResponse {
	registrations: RegistrationCounts[];
	gender: GenderCounts[];
	race: RaceCounts[];
	academicYear: AcademicYearCounts[];
	codingExp: CodingExpCounts[];
}

export interface AnalyticsScansResponse {
	id: string;
	firstName: string;
	lastName: string;
	count: number;
}

export interface AnalyticsEventsResponse {
	type: string;
	id: string;
	name: string;
	count: number;
}
