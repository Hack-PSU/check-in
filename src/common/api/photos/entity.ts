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
}
