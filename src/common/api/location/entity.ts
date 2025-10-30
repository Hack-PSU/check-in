export interface LocationEntity {
	id: number;
	name: string;
	capacity: number;
}

export interface LocationCreateEntity extends Omit<LocationEntity, "id"> {}

export interface LocationUpdateEntity extends Partial<LocationCreateEntity> {}
