import { apiFetch } from "../apiClient";
import { PhotoUploadResponse, PhotoEntity } from "./entity";

export const uploadPhoto = async (file: File): Promise<PhotoUploadResponse> => {
	const formData = new FormData();
	formData.append("photo", file);

	const fileType = file.type.split('/')[1] || 'unknown';
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
