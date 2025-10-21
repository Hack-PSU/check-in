import { apiFetch } from "@/common/api/apiClient";
import {
	ReservationEntity,
	ReservationCreateEntity,
	ReservationUpdateEntity,
} from "./entity";
import { LocationEntity } from "../location/entity";

export async function getAllReservations(
	hackathonId?: string
): Promise<ReservationEntity[]> {
	const params = hackathonId ? `?hackathonId=${hackathonId}` : "";
	return apiFetch<ReservationEntity[]>(`/reservations${params}`, {
		method: "GET",
	});
}

export async function getReservation(id: string): Promise<ReservationEntity> {
	return apiFetch<ReservationEntity>(`/reservations/${id}`, {
		method: "GET",
	});
}

export async function createReservation(
	data: ReservationCreateEntity
): Promise<ReservationEntity> {
	return apiFetch<ReservationEntity>("/reservations", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateReservation(
	id: string,
	data: ReservationUpdateEntity
): Promise<ReservationEntity> {
	return apiFetch<ReservationEntity>(`/reservations/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function deleteReservation(id: string): Promise<void> {
	return apiFetch<void>(`/reservations/${id}`, { method: "DELETE" });
}

export async function getAllLocations(): Promise<LocationEntity[]> {
	return apiFetch<LocationEntity[]>("/locations", { method: "GET" });
}
