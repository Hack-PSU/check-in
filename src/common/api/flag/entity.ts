export interface FlagEntity {
	name: string;
	isEnabled: boolean;
}

export interface ActivateFlagBody {
	name: string;
	isEnabled: boolean;
	broadcast?: boolean;
}

export interface PatchFlagsBody {
	flags: {
		name: string;
		isEnabled: boolean;
	}[];
}
