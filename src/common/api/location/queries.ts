import {
  createMutation,
  CreateMutationReturn,
  createQuery,
  CreateQueryReturn,
} from "@/common/api/utils";
import { LocationEntity } from "./entity";
import { QueryAction, QueryScope } from "@/common/api/types";

/**
 * Get All Locations
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin_Location-Get_Location_List
 */
export const getAllLocations: CreateQueryReturn<LocationEntity[]> =
  createQuery("/locations");

/**
 * Create A Location
 * @param entity
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin_Location-Create_Location
 */
export const createLocation: CreateMutationReturn<
  Omit<LocationEntity, "id">,
  LocationEntity
> = createMutation("/locations");

/**
 * Update A Location
 * @param entity
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin_Location-Update_Location
 */
export const updateLocation: CreateMutationReturn<
  Partial<Omit<LocationEntity, "id">>,
  LocationEntity,
  { id: number }
> = createMutation("/locations/:id", "PATCH");

/**
 * Delete A Location
 * @param params
 */
export const deleteLocation: CreateMutationReturn<{}, {}, { id: number }> =
  createMutation("/locations/:id");

export const LocationKeys = {
  all: [{ entity: "location" }] as const,
  findAll: () =>
    [
      {
        ...LocationKeys.all[0],
        action: QueryAction.query,
        scope: QueryScope.ALL,
      },
    ] as const,
  findById: (id: string | number) =>
    [{ ...LocationKeys.all[0], action: QueryAction.query, scope: id }] as const,
  createOne: () =>
    [
      {
        ...LocationKeys.all[0],
        action: QueryAction.create,
        scope: QueryScope.NEW,
      },
    ] as const,
  update: (id: string | number) =>
    [
      { ...LocationKeys.all[0], action: QueryAction.update, scope: id },
    ] as const,
  delete: (id: string | number) =>
    [
      { ...LocationKeys.all[0], action: QueryAction.delete, scope: id },
    ] as const,
  updateBatch: () =>
    [
      {
        ...LocationKeys.all[0],
        action: QueryAction.updateBatch,
        scope: QueryScope.ALL,
      },
    ] as const,
};
