import { apiFetch } from "@/common/api/apiClient";
import { EventEntityResponse, CreateScanEntity } from "./entity";

export async function getAllEvents(
	hackathonId?: string
): Promise<EventEntityResponse[]> {
	const url = hackathonId ? `/events?hackathonId=${hackathonId}` : "/events";
	return apiFetch<EventEntityResponse[]>(url, { method: "GET" });
}

export async function getEvent(id: string): Promise<EventEntityResponse> {
	return apiFetch<EventEntityResponse>(`/events/${id}`, { method: "GET" });
}

export async function createEvent(
	data: FormData
): Promise<EventEntityResponse> {
	return apiFetch<EventEntityResponse>("/events", {
		method: "POST",
		body: data,
	});
}

export async function updateEvent(
	id: string,
	data: FormData
): Promise<EventEntityResponse> {
	return apiFetch<EventEntityResponse>(`/events/${id}`, {
		method: "PATCH",
		body: data,
	});
}

export async function replaceEvent(
	id: string,
	data: FormData
): Promise<EventEntityResponse> {
	return apiFetch<EventEntityResponse>(`/events/${id}`, {
		method: "PUT",
		body: data,
	});
}

export async function deleteEvent(id: string): Promise<void> {
	return apiFetch<void>(`/events/${id}`, { method: "DELETE" });
}

export async function subscribeToEvent(id: string): Promise<void> {
	return apiFetch<void>(`/events/${id}/notifications/subscribe`, {
		method: "POST",
	});
}

export async function unsubscribeFromEvent(id: string): Promise<void> {
	return apiFetch<void>(`/events/${id}/notifications/unsubscribe`, {
		method: "POST",
	});
}

export async function checkInEvent(
	id: string,
	userId: string,
	data: CreateScanEntity
): Promise<void> {
	return apiFetch<void>(`/events/${id}/check-in/user/${userId}`, {
		method: "POST",
		body: JSON.stringify(data),
	});
}
