import {
  createMutation,
  CreateMutationReturn,
  createQuery,
  CreateQueryReturn,
} from "@/common/api/utils";
import { UserEntity } from "./entity";
import { QueryAction, QueryScope } from "@/common/api/types";

/**
 * Get All Users
 * @param params (optional)
 * @param token (optional)
 * @link https://api.hackpsu.org/v2/doc/#api-Admin_Statistics-Get_list_of_all_users
 */
export const getAllUsers: CreateQueryReturn<UserEntity[]> =
  createQuery("/users?active=true");

/**
 * Create a User
 */
export const createUser: CreateMutationReturn<UserEntity> =
  createMutation("/users");

/**
 * Check-In User to Event
 */
export const checkInUserToEvent: CreateMutationReturn<
  { organizerId: string },
  {},
  { userId: string; eventId: string }
> = createMutation("/users/:userId/check-in/event/:eventId");

export const HackerKeys = {
  all: [{ entity: "hacker" }],
  findAll: () =>
    [
      {
        ...HackerKeys.all[0],
        action: QueryAction.query,
        scope: QueryScope.ALL,
      },
    ] as const,
  findById: (id: string | number) =>
    [{ ...HackerKeys.all[0], action: QueryAction.query, scope: id }] as const,
  update: (id: string | number) =>
    [{ ...HackerKeys.all[0], action: QueryAction.update, scope: id }] as const,
  delete: (id: string | number) =>
    [{ ...HackerKeys.all[0], action: QueryAction.delete, scope: id }] as const,
};
