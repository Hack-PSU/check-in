import { createMutation, CreateMutationReturn } from "@/common/api/utils";
import {
  UserMessageEntity,
  BroadcastMessageEntity,
} from "@/common/api/notification/entity";
import { QueryAction } from "@/common/api/types";

/**
 * Sends a notification message to a specific user, topic, or broadcast
 * @param entity (INotificationPayloadEntity)
 * @param params (optional)
 * @param token (optional)
 */
export const sendUserMessage: CreateMutationReturn<UserMessageEntity, {}> =
  createMutation("/notifications/send");

/**
 * Sends a data message to a specific topic or broadcast
 * @param entity (INotificationEntity)
 * @param params (optional)
 * @param token (optional)
 */
export const sendBroadcastMessage: CreateMutationReturn<
  BroadcastMessageEntity,
  {}
> = createMutation("/notifications/broadcast");

export const NotificationKeys = {
  all: [{ entity: "notification" }] as const,
  createOne: (...ids: string[]) =>
    [
      {
        ...NotificationKeys.all[0],
        action: QueryAction.create,
        scope: [...ids],
      },
    ] as const,
};
