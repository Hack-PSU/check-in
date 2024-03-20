export enum SocketRoom {
  ADMIN = "organizers",
  MOBILE = "users",
}

export interface FlagsEntity {
  name: string;
  isEnabled: boolean;
}

export interface ToggleFlagEntity extends FlagsEntity {
  broadcast?: SocketRoom;
}
