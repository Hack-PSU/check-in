import { apiFetch } from "@/common/api/apiClient";
import {
	ExtraCreditAssignmentEntity,
	ECClassResponse,
	ExtraCreditClassEntity,
	ECClassCreateEntity,
	ECClassPatchEntity,
} from "./entity";

export async function getAllExtraCreditClasses(): Promise<
	ExtraCreditClassEntity[]
> {
	return apiFetch<ExtraCreditClassEntity[]>("/extra-credit/classes", {
		method: "GET",
	});
}

export async function getExtraCreditClass(
	id: number
): Promise<ECClassResponse> {
	return apiFetch<ECClassResponse>(`/extra-credit/classes/${id}`, {
		method: "GET",
	});
}

export async function createExtraCreditClass(
	data: ECClassCreateEntity
): Promise<ExtraCreditClassEntity> {
	return apiFetch<ExtraCreditClassEntity>("/extra-credit/classes", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateExtraCreditClass(
	id: number,
	data: ECClassPatchEntity
): Promise<ExtraCreditClassEntity> {
	return apiFetch<ExtraCreditClassEntity>(`/extra-credit/classes/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function replaceExtraCreditClass(
	id: number,
	data: ECClassCreateEntity
): Promise<ExtraCreditClassEntity> {
	return apiFetch<ExtraCreditClassEntity>(`/extra-credit/classes/${id}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

export async function deleteExtraCreditClass(id: number): Promise<void> {
	return apiFetch<void>(`/extra-credit/classes/${id}`, { method: "DELETE" });
}

export async function getAllExtraCreditAssignments(): Promise<
	ExtraCreditAssignmentEntity[]
> {
	return apiFetch<ExtraCreditAssignmentEntity[]>("/extra-credit/assignments", {
		method: "GET",
	});
}
