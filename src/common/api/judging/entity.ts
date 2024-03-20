export interface ScoreEntity {
  projectId: number;
  judgeId: number;
  creativity: number;
  technical: number;
  implementation: number;
  clarity: number;
  growth: number;
  submitted: boolean;
  challenge1: number;
  challenge2: number;
  challenge3: number;
}

export type ScoreDataEntity = Omit<
  ScoreEntity,
  "hackathonId" | "judgeId" | "projectId"
>;

export interface ReassignRequestEntity {
  excludeProjects: number[];
}

export interface ProjectEntity {
  id: number;
  name: string;
  hackathonId?: string;
}

export interface ProjectScoreEntity extends Omit<ProjectEntity, "hackathonId"> {
  score: ScoreDataEntity;
}
