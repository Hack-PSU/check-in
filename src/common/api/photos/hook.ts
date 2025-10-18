import {
	useMutation,
	useQuery,
	useQueryClient,
	UseMutationResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { uploadPhoto, getAllPhotos, getPendingPhotos, approvePhoto, rejectPhoto } from "./provider";
import { PhotoUploadResponse, PhotoEntity } from "./entity";

export function useUploadPhoto(): UseMutationResult<
	PhotoUploadResponse,
	Error,
	File
> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: uploadPhoto,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["photos"] });
			queryClient.invalidateQueries({ queryKey: ["photos", "pending"] });
		},
	});
}

export function useGetAllPhotos(): UseQueryResult<PhotoEntity[], Error> {
	return useQuery({
		queryKey: ["photos"],
		queryFn: getAllPhotos,
	});
}

export function useGetPendingPhotos(): UseQueryResult<PhotoEntity[], Error> {
	return useQuery({
		queryKey: ["photos", "pending"],
		queryFn: getPendingPhotos,
	});
}

export function useApprovePhoto(): UseMutationResult<
	{ message: string },
	Error,
	string
> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: approvePhoto,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["photos"] });
			queryClient.invalidateQueries({ queryKey: ["photos", "pending"] });
		},
	});
}

export function useRejectPhoto(): UseMutationResult<
	{ message: string },
	Error,
	string
> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: rejectPhoto,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["photos"] });
			queryClient.invalidateQueries({ queryKey: ["photos", "pending"] });
		},
	});
}
