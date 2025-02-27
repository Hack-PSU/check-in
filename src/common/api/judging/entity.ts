import { OrganizerEntity } from "../organizer";

// A Score returned from the API
export interface ScoreEntity {
	id: number;
	hackathonId: string;
	creativity?: number;
	technical?: number;
	implementation?: number;
	clarity?: number;
	growth?: number;
	challenge1?: number;
	challenge2?: number;
	challenge3?: number;
	total?: number;
	submitted?: boolean;
	judge: Omit<OrganizerEntity, "privilege">;
	project: ProjectEntity;
}

// A Project as returned from the API
export interface ProjectEntity {
	id: number;
	name: string;
	hackathonId: string;
	categories?: string;
}

// For creating a new score (no id)
export interface ScoreCreateEntity extends Omit<ScoreEntity, "id"> {}

// For updating a score (all fields optional except id)
export interface ScoreUpdateEntity
	extends Partial<Omit<ScoreEntity, "id" | "hackathonId">> {}

// The judge info used in a breakdown
export interface ScoreBreakdownJudgeEntity {
	id: string;
	firstName: string;
	lastName: string;
}

// A score breakdown (score info with simplified judge details)
export interface ScoreBreakdownEntity extends Omit<ScoreEntity, "judge"> {
	judge: ScoreBreakdownJudgeEntity;
}

// A project breakdown aggregates averages and includes all score breakdowns
export interface ProjectBreakdownEntity extends ProjectEntity {
	average: number;
	creativity: number;
	implementation: number;
	clarity: number;
	growth: number;
	technical: number;
	challenge1: number;
	challenge2: number;
	challenge3: number;
	scores: ScoreBreakdownEntity[];
}

// For assigning judges to projects
export interface JudgingAssignmentEntity {
	users: string[];
	projects: number[];
	projectsPerUser: number;
}
