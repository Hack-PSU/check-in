import { createQuery, CreateQueryReturn } from "@/common/api/utils";
import { HackathonEntity } from "./entity";
import { QueryAction, QueryScope } from "@/common/api/types";

export const getActiveHackathon: CreateQueryReturn<HackathonEntity[]> =
  createQuery("/hackathons?active=true");

export const HackathonQueryKeys = {
  all: [{ entity: "hackathons" }],
  findOne: () =>
    [
      {
        ...HackathonQueryKeys.all[0],
        scope: QueryScope.ID,
        action: QueryAction.query,
      },
    ] as const,
};
