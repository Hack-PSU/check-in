import { apiFetch } from "../apiClient";
import { PhotoUploadResponse, PhotoEntity } from "./entity";

export const uploadPhoto = async (file: File, customFileType?: string): Promise<PhotoUploadResponse> => {
	const formData = new FormData();
	formData.append("photo", file);

	const fileType = customFileType || file.type.split('/')[1] || 'unknown';
	formData.append("fileType", fileType);
	const data = await apiFetch<PhotoUploadResponse>("/photos/upload", {
		method: "POST",
		body: formData,
	});
	return data;
};

export const getAllPhotos = async (): Promise<PhotoEntity[]> => {
	const data = await apiFetch<PhotoEntity[]>("/photos", {
		method: "GET",
	});
	return data;
};

export const getPendingPhotos = async (): Promise<PhotoEntity[]> => {
	const data = await apiFetch<PhotoEntity[]>("/photos/pending", {
		method: "GET",
	});
	return data;
};

export const approvePhoto = async (filename: string): Promise<{ message: string }> => {
	const data = await apiFetch<{ message: string }>(`/photos/${filename}/approve`, {
		method: "PATCH",
	});
	return data;
};

export const rejectPhoto = async (filename: string): Promise<{ message: string }> => {
	const data = await apiFetch<{ message: string }>(`/photos/${filename}/reject`, {
		method: "PATCH",
	});
	return data;
};
