import { apiFetch } from "@/common/api/apiClient";
import { UserEntity } from "./entity";

export async function getAllUsers(active?: boolean): Promise<UserEntity[]> {
	const queryParam = active !== undefined ? `?active=${active}` : "";
	return apiFetch<UserEntity[]>(`/users${queryParam}`, { method: "GET" });
}

export async function getUser(id: string): Promise<UserEntity> {
	return apiFetch<UserEntity>(`/users/${id}`, { method: "GET" });
}

export async function createUser(
	data: Omit<UserEntity, "id">
): Promise<UserEntity> {
	return apiFetch<UserEntity>("/users", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateUser(
	id: string,
	data: Partial<Omit<UserEntity, "id">>
): Promise<UserEntity> {
	return apiFetch<UserEntity>(`/users/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function replaceUser(
	id: string,
	data: Omit<UserEntity, "id">
): Promise<UserEntity> {
	return apiFetch<UserEntity>(`/users/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

export async function deleteUser(id: string): Promise<void> {
	return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

export async function getUserResume(id: string): Promise<Blob> {
	return apiFetch<Blob>(`/users/${id}/resumes`, {
		method: "GET",
	});
}

// This has a header of zip, so it should be downloaded
export async function getAllResumes(): Promise<Blob> {
	const res = apiFetch<Blob>(`/users/resumes`, {
		method: "GET",
	});

	return await res;
}
