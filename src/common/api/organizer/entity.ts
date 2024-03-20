export enum Role {
  NONE,
  VOLUNTEER,
  TEAM,
  EXEC,
  TECH,
  FINANCE,
}

export interface OrganizerEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  privilege: Role;
  judgingLocation: string;
  award: string;
}
