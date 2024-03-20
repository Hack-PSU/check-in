import { EventKeys } from "./event";
import { HackerKeys } from "./hacker";
import { LocationKeys } from "./location";
import { OrganizerQueryKeys } from "./organizer";
import { NotificationKeys } from "./notification";
import { JudgingScoreKeys } from "./judging";
import { FlagQueryKeys } from "./flags";
import { HackathonQueryKeys } from "@/common/api/hackathon";

export const QueryKeys = {
  hackers: HackerKeys,
  events: EventKeys,
  locations: LocationKeys,
  organizers: OrganizerQueryKeys,
  notifications: NotificationKeys,
  judgingScores: JudgingScoreKeys,
  flags: FlagQueryKeys,
  hackathons: HackathonQueryKeys,
};

export * from "./event";
export * from "./hacker";
export * from "./location";
export * from "./organizer";
export * from "./notification";
export * from "./judging";
export * from "./flags";
export * from "./hackathon";
export * from "./utils";
