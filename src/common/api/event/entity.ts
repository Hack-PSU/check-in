export enum EventType {
  WORKSHOP = "workshop",
  FOOD = "food",
  ACTIVITY = "activity",
  CHECKIN = "checkIn",
}

export interface EventLocation {
  id: number;
  name: string;
}

export interface EventEntity {
  id: string;
  name: string;
  type: EventType;
  icon: string;
  description: string;
  startTime: number;
  endTime: number;
  location: EventLocation;
  wsPresenterNames?: string;
  wsRelevantSkills?: string;
  wsSkillLevel?: string;
  wsUrls?: string[];
  hackathonId?: string;
}

export interface PatchEventEntity
  extends Partial<
    Omit<EventEntity, "id" | "hackathonId" | "icon" | "location">
  > {
  locationId?: number;
}
