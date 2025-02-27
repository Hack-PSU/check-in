import { apiFetch } from "@/common/api/apiClient";
import {
	HackathonEntity,
	HackathonCreateEntity,
	HackathonUpdateEntity,
	StaticActiveHackathonEntity,
} from "./entity";

export async function getAllHackathons(
	active?: boolean
): Promise<HackathonEntity[]> {
	const query = active !== undefined ? `?active=${active}` : "";
	return apiFetch<HackathonEntity[]>(`/hackathons${query}`, { method: "GET" });
}

export async function getHackathon(id: string): Promise<HackathonEntity> {
	return apiFetch<HackathonEntity>(`/hackathons/${id}`, { method: "GET" });
}

export async function createHackathon(
	data: HackathonCreateEntity
): Promise<HackathonEntity> {
	return apiFetch<HackathonEntity>("/hackathons", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateHackathon(
	id: string,
	data: HackathonUpdateEntity
): Promise<HackathonEntity> {
	return apiFetch<HackathonEntity>(`/hackathons/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function replaceHackathon(
	id: string,
	data: HackathonCreateEntity
): Promise<HackathonEntity> {
	return apiFetch<HackathonEntity>(`/hackathons/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

export async function deleteHackathon(id: string): Promise<void> {
	return apiFetch<void>(`/hackathons/${id}`, { method: "DELETE" });
}

export async function markActiveHackathon(
	id: string
): Promise<HackathonEntity> {
	return apiFetch<HackathonEntity>(`/hackathons/${id}/active`, {
		method: "PATCH",
	});
}

export async function getActiveHackathonForStatic(): Promise<StaticActiveHackathonEntity> {
	return apiFetch<StaticActiveHackathonEntity>("/hackathons/active/static", {
		method: "GET",
	});
}
