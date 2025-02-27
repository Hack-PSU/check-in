export interface LocationEntity {
	id: number;
	name: string;
}

export interface LocationCreateEntity extends Omit<LocationEntity, "id"> {}

export interface LocationUpdateEntity extends Partial<LocationCreateEntity> {}
