import { apiFetch } from "@/common/api/apiClient";
import { SponsorEntity } from "./entity";

export async function getAllSponsors(
	hackathonId?: string
): Promise<SponsorEntity[]> {
	const queryParam = hackathonId ? `?hackathonId=${hackathonId}` : "";
	return apiFetch<SponsorEntity[]>(`/sponsors${queryParam}`, { method: "GET" });
}

export async function getSponsor(id: number): Promise<SponsorEntity> {
	return apiFetch<SponsorEntity>(`/sponsors/${id}`, { method: "GET" });
}

export async function createSponsor(
	data: Omit<SponsorEntity, "id">
): Promise<SponsorEntity> {
	return apiFetch<SponsorEntity>("/sponsors", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateSponsor(
	id: number,
	data: Partial<Omit<SponsorEntity, "id">>
): Promise<SponsorEntity> {
	return apiFetch<SponsorEntity>(`/sponsors/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function replaceSponsor(
	id: number,
	data: Omit<SponsorEntity, "id">
): Promise<SponsorEntity> {
	return apiFetch<SponsorEntity>(`/sponsors/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

export async function deleteSponsor(id: number): Promise<void> {
	return apiFetch<void>(`/sponsors/${id}`, { method: "DELETE" });
}

export async function batchUpdateSponsors(
	data: Partial<SponsorEntity>[]
): Promise<SponsorEntity[]> {
	return apiFetch<SponsorEntity[]>("/sponsors/batch/update", {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}
