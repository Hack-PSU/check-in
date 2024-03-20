export enum DefaultTopic {
  ALL = "ALL",
  ORGANIZER = "ORGANIZER",
}

export interface MessageEntity {
  title: string;
  body: string;
  scheduleTime?: string;
  metadata?: Record<string, any>;
}

export interface UserMessageEntity extends MessageEntity {
  userId: string;
}

export interface BroadcastMessageEntity extends MessageEntity {
  broadcast?: DefaultTopic;
  topic?: string;
}
