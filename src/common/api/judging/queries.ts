import {
  createMutation,
  CreateMutationReturn,
  createQuery,
  CreateQueryReturn,
} from "@/common/api/utils";
import {
  ProjectScoreEntity,
  ReassignRequestEntity,
  ScoreDataEntity,
  ScoreEntity,
} from "./entity";
import { QueryAction, QueryScope } from "@/common/api/types";

export const getAllScoresByJudge: CreateQueryReturn<
  ProjectScoreEntity[],
  { id: string }
> = createQuery("/organizers/:id/judging/projects");

/**
 * Submit a score for a project
 */
export const submitScore: CreateMutationReturn<
  Partial<ScoreDataEntity>,
  ScoreEntity,
  { id: string; projectId: number }
> = createMutation("/organizers/:id/judging/projects/:projectId", "PATCH");

/**
 * Request Project Reassignment
 */
export const reassignProject: CreateMutationReturn<
  ReassignRequestEntity,
  {},
  { organizerId: string; projectId: number }
> = createMutation(
  "/organizers/:organizerId/judging/projects/:projectId",
  "DELETE"
);



export const JudgingScoreKeys = {
  all: [{ entity: "judging_score" }] as const,
  createOne: () => [
    {
      ...JudgingScoreKeys.all[0],
      action: QueryAction.create,
      scope: QueryScope.NEW,
    },
  ],
  findByJudge: (id: number | string) =>
    [
      {
        ...JudgingScoreKeys.all[0],
        action: QueryAction.query,
        scope: id,
      },
    ] as const,
  findAll: () =>
    [
      {
        ...JudgingScoreKeys.all[0],
        action: QueryAction.query,
        scope: QueryScope.ALL,
      },
    ] as const,
  deleteOne: () =>
    [
      {
        ...JudgingScoreKeys.all[0],
        action: QueryAction.delete,
        scope: QueryScope.ID,
      },
    ] as const,
};
