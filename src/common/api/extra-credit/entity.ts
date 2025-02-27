export interface ExtraCreditAssignmentEntity {
	userId: string;
	classId: number;
}

export interface ExtraCreditClassEntity {
	id: number;
	name: string;
	hackathonId?: string;
}

export interface ECClassAssignedUser {
	id: string;
	firstName: string;
	lastName: string;
}

export interface ECClassResponse extends ExtraCreditClassEntity {
	users: ECClassAssignedUser[];
}

export interface ECClassCreateEntity {
	name: string;
	hackathonId?: string;
}

export type ECClassPatchEntity = Partial<ECClassCreateEntity>;
