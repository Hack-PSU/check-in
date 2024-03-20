import {
  createMutation,
  CreateMutationReturn,
  createQuery,
  CreateQueryReturn,
} from "@/common/api/utils";
import { OrganizerEntity } from "./entity";
import { QueryAction, QueryScope } from "@/common/api/types";

/**
 * Gets all organizers for the active hackathon
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin-Get_All_Organizers
 */
export const getAllOrganizers: CreateQueryReturn<OrganizerEntity[]> =
  createQuery("/organizers");

/**
 * Gets an organizer using their Firebase UID
 * @param params (required): The Firebase UID of the user
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin-Get_Organizer
 */
export const getOrganizer: CreateQueryReturn<OrganizerEntity, { id: string }> =
  createQuery("/organizers/:id");

/**
 * Creates an organizer
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin-Add_Organizer
 */
export const createOrganizer: CreateMutationReturn<OrganizerEntity> =
  createMutation("/organizers");

/**
 * Updates an organizer
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin-Delete_Organizer
 */
export const updateOrganizer: CreateMutationReturn<
  Partial<Omit<OrganizerEntity, "id">>,
  OrganizerEntity,
  { id: string }
> = createMutation("/organizers/:id", "PATCH");

export const OrganizerQueryKeys = {
  all: [{ entity: "organizer" }] as const,
  findAll: () =>
    [
      {
        ...OrganizerQueryKeys.all[0],
        action: QueryAction.query,
        scope: QueryScope.ALL,
      },
    ] as const,
  findOne: (id: string | number) =>
    [
      {
        ...OrganizerQueryKeys.all[0],
        action: QueryAction.query,
        scope: id,
      },
    ] as const,
  createOne: () =>
    [
      {
        ...OrganizerQueryKeys.all[0],
        action: QueryAction.create,
        scope: QueryScope.NEW,
      },
    ] as const,
  updateOne: (...ids: (string | number)[]) =>
    [
      {
        ...OrganizerQueryKeys.all[0],
        action: QueryAction.update,
        scope: [...ids],
      },
    ] as const,
};
