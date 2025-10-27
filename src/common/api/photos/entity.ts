export interface PhotoUploadResponse {
	photoId: string;
	photoUrl: string;
}

export interface PhotoEntity {
	name: string;
	url: string;
	createdAt: string;
	uploadedBy?: string;
	approvalStatus?: "pending" | "approved" | "rejected" | "unknown";
	derivatives?: {
		[key: string]: string; // e.g., webp_480, webp_960, webp_1600, jpeg_480, etc.
	};
}
