import { apiFetch } from "@/common/api/apiClient";
import { FlagEntity, ActivateFlagBody, PatchFlagsBody } from "./entity";

export async function getAllFlags(): Promise<FlagEntity[]> {
	return apiFetch<FlagEntity[]>("/flags", { method: "GET" });
}

export async function getFlagState(id: string): Promise<FlagEntity> {
	return apiFetch<FlagEntity>(`/flags/state/${id}`, { method: "GET" });
}

export async function activateFlag(data: ActivateFlagBody): Promise<void> {
	return apiFetch<void>("/flags/toggle", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function patchFlags(data: PatchFlagsBody): Promise<void> {
	return apiFetch<void>("/flags", {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}
