import {
  createMutation,
  CreateMutationReturn,
  createQuery,
  CreateQueryReturn,
} from "@/common/api/utils";
import { FlagsEntity, ToggleFlagEntity } from "./entity";
import { QueryAction, QueryScope } from "@/common/api/types";

/**
 * Get application flags for admin mobile app
 * @param params (optional)
 * @param token (optional)
 */
export const getAllAppFlags: CreateQueryReturn<FlagsEntity[]> =
  createQuery("/flags");

export const getOneAppFlag: CreateQueryReturn<FlagsEntity, { id: string }> =
  createQuery("/flags/state/:id");

export const toggleFlag: CreateMutationReturn<ToggleFlagEntity, {}> =
  createMutation("/flags/toggle");

/**
 * Patch application flags
 * @param entity ({ flags: IFlagsEntity[] })
 * @param params (optional)
 * @param token (optional)
 */
export const patchAppFlags: CreateMutationReturn<{ flags: FlagsEntity[] }, {}> =
  createMutation("/flags", "PATCH");

export const FlagQueryKeys = {
  all: [{ entity: "flag" }] as const,
  findAll: () =>
    [
      {
        ...FlagQueryKeys.all[0],
        action: QueryAction.query,
        scope: QueryScope.ALL,
      },
    ] as const,
  findOne: (id: number | string) =>
    [
      {
        ...FlagQueryKeys.all[0],
        action: QueryAction.query,
        scope: id,
      },
    ] as const,
};
