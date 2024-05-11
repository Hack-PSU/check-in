import { EventType } from "@/common/api/event";

interface CountsResponse {
  count: number;
}

interface RegistrationCounts extends CountsResponse {
  id: string;
  name: string;
}

interface GenderCounts extends CountsResponse {
  gender: string;
}

interface RaceCounts extends CountsResponse {
  race: string;
}

interface AcademicYearCounts extends CountsResponse {
  academicYear: string;
}

interface CodingExpCounts extends CountsResponse {
  codingExperience: string;
}

export interface AnalyticsSummaryResponse {
  registrations: RegistrationCounts[];
  gender: GenderCounts[];
  race: RaceCounts[];
  academicYear: AcademicYearCounts[];
  codingExp: CodingExpCounts[];
}

export interface AnalyticsEventsResponse {
  id: string;
  name: string;
  type: EventType;
  count: number;
}

export interface AnalyticsScansResponse {
  id: string;
  firstName: string;
  lastName: string;
  count: number;
}
