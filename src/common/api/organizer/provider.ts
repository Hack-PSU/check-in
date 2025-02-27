import { apiFetch } from "@/common/api/apiClient";
import { OrganizerEntity } from "./entity";

export async function getAllOrganizers(): Promise<OrganizerEntity[]> {
	return apiFetch<OrganizerEntity[]>("/organizers", { method: "GET" });
}

export async function getOrganizer(id: string): Promise<OrganizerEntity> {
	return apiFetch<OrganizerEntity>(`/organizers/${id}`, { method: "GET" });
}

export async function createOrganizer(
	data: Omit<OrganizerEntity, "id">
): Promise<OrganizerEntity> {
	return apiFetch<OrganizerEntity>("/organizers", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateOrganizer(
	id: string,
	data: Partial<Omit<OrganizerEntity, "id">>
): Promise<OrganizerEntity> {
	return apiFetch<OrganizerEntity>(`/organizers/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function deleteOrganizer(id: string): Promise<void> {
	return apiFetch<void>(`/organizers/${id}`, { method: "DELETE" });
}
