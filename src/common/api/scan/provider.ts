import { apiFetch } from "@/common/api/apiClient";
import { ScanEntity, ScanAnalyticsEntity } from "./entity";

export async function getAllScans(hackathonId?: string): Promise<ScanEntity[]> {
	const queryParam = hackathonId ? `?hackathonId=${hackathonId}` : "";
	return apiFetch<ScanEntity[]>(`/scans${queryParam}`, { method: "GET" });
}

export async function getScan(id: string): Promise<ScanEntity> {
	return apiFetch<ScanEntity>(`/scans/${id}`, { method: "GET" });
}

export async function getAllScansByEvent(): Promise<ScanAnalyticsEntity[]> {
	return apiFetch<ScanAnalyticsEntity[]>(`/scans/analytics/events`, {
		method: "GET",
	});
}

export async function getScansForEvent(eventId: string): Promise<ScanEntity[]> {
	return apiFetch<ScanEntity[]>(`/scans/analytics/events/${eventId}`, {
		method: "GET",
	});
}

export async function getAllScansByOrganizer(): Promise<ScanEntity[]> {
	return apiFetch<ScanEntity[]>(`/scans/analytics/organizers`, {
		method: "GET",
	});
}

export async function getScansForOrganizer(
	organizerId: string
): Promise<ScanEntity[]> {
	return apiFetch<ScanEntity[]>(`/scans/analytics/organizers/${organizerId}`, {
		method: "GET",
	});
}
