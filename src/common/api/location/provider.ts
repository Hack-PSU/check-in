import { apiFetch } from "@/common/api/apiClient";
import {
	LocationEntity,
	LocationCreateEntity,
	LocationUpdateEntity,
} from "./entity";

export async function getAllLocations(): Promise<LocationEntity[]> {
	return apiFetch<LocationEntity[]>("/locations", { method: "GET" });
}

export async function getLocation(id: number): Promise<LocationEntity> {
	return apiFetch<LocationEntity>(`/locations/${id}`, { method: "GET" });
}

export async function createLocation(
	data: LocationCreateEntity
): Promise<LocationEntity> {
	return apiFetch<LocationEntity>("/locations", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateLocation(
	id: number,
	data: LocationUpdateEntity
): Promise<LocationEntity> {
	return apiFetch<LocationEntity>(`/locations/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function replaceLocation(
	id: number,
	data: LocationCreateEntity
): Promise<LocationEntity> {
	return apiFetch<LocationEntity>(`/locations/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

export async function deleteLocation(id: number): Promise<void> {
	return apiFetch<void>(`/locations/${id}`, { method: "DELETE" });
}
