import { apiFetch } from "@/common/api/apiClient";
import {
	TeamEntity,
	TeamCreateEntity,
	TeamUpdateEntity,
	AddUserByEmailEntity,
} from "./entity";

export async function getAllTeams(active?: boolean): Promise<TeamEntity[]> {
	const params =
		active !== undefined ? `?active=${active ? "true" : "false"}` : "";
	return apiFetch<TeamEntity[]>(`/teams${params}`, { method: "GET" });
}

export async function getTeam(id: string): Promise<TeamEntity> {
	return apiFetch<TeamEntity>(`/teams/${id}`, { method: "GET" });
}

export async function createTeam(
	data: TeamCreateEntity
): Promise<TeamEntity> {
	return apiFetch<TeamEntity>("/teams", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateTeam(
	id: string,
	data: TeamUpdateEntity
): Promise<TeamEntity> {
	return apiFetch<TeamEntity>(`/teams/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function addUserByEmail(
	id: string,
	data: AddUserByEmailEntity
): Promise<TeamEntity> {
	return apiFetch<TeamEntity>(`/teams/${id}/add-user`, {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function deleteTeam(id: string): Promise<TeamEntity> {
	return apiFetch<TeamEntity>(`/teams/${id}`, { method: "DELETE" });
}
