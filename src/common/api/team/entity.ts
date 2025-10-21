export interface TeamEntity {
	id: string;
	name: string;
	hackathonId: string;
	isActive: boolean;
	member1: string | null;
	member2: string | null;
	member3: string | null;
	member4: string | null;
	member5: string | null;
}

export interface TeamCreateEntity {
	name: string;
	member1?: string;
	member2?: string;
	member3?: string;
	member4?: string;
	member5?: string;
}

export interface TeamUpdateEntity {
	name?: string;
	member1?: string | null;
	member2?: string | null;
	member3?: string | null;
	member4?: string | null;
	member5?: string | null;
}

export interface AddUserByEmailEntity {
	email: string;
}
