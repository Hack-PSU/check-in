import { apiFetch } from "../apiClient";
import {
	ScoreEntity,
	ScoreCreateEntity,
	ScoreUpdateEntity,
	ProjectEntity,
	ProjectBreakdownEntity,
	JudgingAssignmentEntity,
} from "./entity";

// Scores Endpoints
export const getAllScores = async (): Promise<ScoreEntity[]> => {
	const data = await apiFetch<ScoreEntity[]>("/judging/scores", {
		method: "GET",
	});
	return data;
};

export const getScore = async (id: number): Promise<ScoreEntity> => {
	const data = await apiFetch<ScoreEntity>(`/judging/scores/${id}`, {
		method: "GET",
	});
	return data;
};

export const createScore = async (
	score: ScoreCreateEntity
): Promise<ScoreEntity> => {
	const data = await apiFetch<ScoreEntity>("/judging/scores", {
		method: "POST",
		body: JSON.stringify(score),
	});
	return data;
};

export const updateScore = async (
	id: string,
	projectId: number,
	score: ScoreUpdateEntity
): Promise<ScoreEntity> => {
	const data = await apiFetch<ScoreEntity>(
		`/organizers/${id}/judging/projects/${projectId}`,
		{
			method: "PATCH",
			body: JSON.stringify(score),
		}
	);
	return data;
};

export const deleteScore = async (id: number): Promise<void> => {
	await apiFetch<void>(`/judging/scores/${id}`, {
		method: "DELETE",
	});
};

// Projects Endpoints
export const getAllProjects = async (): Promise<ProjectEntity[]> => {
	const data = await apiFetch<ProjectEntity[]>("/judging/projects", {
		method: "GET",
	});
	return data;
};

export const getProject = async (id: number): Promise<ProjectEntity> => {
	const data = await apiFetch<ProjectEntity>(`/judging/projects/${id}`, {
		method: "GET",
	});
	return data;
};

export const createProject = async (
	project: Omit<ProjectEntity, "id">
): Promise<ProjectEntity> => {
	const data = await apiFetch<ProjectEntity>("/judging/projects", {
		method: "POST",
		body: JSON.stringify(project),
	});
	return data;
};

export const updateProject = async (
	id: number,
	project: Partial<ProjectEntity>
): Promise<ProjectEntity> => {
	const data = await apiFetch<ProjectEntity>(`/judging/projects/${id}`, {
		method: "PATCH",
		body: JSON.stringify(project),
	});
	return data;
};

export const deleteProject = async (id: number): Promise<void> => {
	await apiFetch<void>(`/judging/projects/${id}`, {
		method: "DELETE",
	});
};

// Breakdown Endpoint
export const getProjectBreakdown = async (): Promise<
	ProjectBreakdownEntity[]
> => {
	const data = await apiFetch<ProjectBreakdownEntity[]>("/judging/breakdown", {
		method: "GET",
	});
	return data;
};

// Judging Assignment Endpoint
export const assignJudging = async (
	data: JudgingAssignmentEntity
): Promise<any> => {
	await apiFetch<void>("/judging/assign", {
		method: "POST",
		body: JSON.stringify(data),
	});
};

// Judging additional endpoints
export const assignAdditionalJudging = async (
	judgeId: string
): Promise<any> => {
	await apiFetch<void>(`/judging/assign/${judgeId}`, {
		method: "POST",
	});
};

export const uploadProjectsCsv = async (
	file: File
): Promise<ProjectEntity[]> => {
	const formData = new FormData();
	formData.append("file", file);

	const data = await apiFetch<ProjectEntity[]>("/judging/projects/upload-csv", {
		method: "POST",
		body: formData,
	});
	return data;
};
