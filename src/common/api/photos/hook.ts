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
		onMutate: async (filename) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["photos"] });
			await queryClient.cancelQueries({ queryKey: ["photos", "pending"] });

			// Snapshot the previous values
			const previousAllPhotos = queryClient.getQueryData<PhotoEntity[]>(["photos"]);
			const previousPendingPhotos = queryClient.getQueryData<PhotoEntity[]>(["photos", "pending"]);

			// Optimistically update both caches
			queryClient.setQueryData<PhotoEntity[]>(["photos", "pending"], (old) => {
				if (!old) return old;
				return old.map(photo =>
					photo.name === filename
						? { ...photo, approvalStatus: "approved" }
						: photo
				);
			});

			queryClient.setQueryData<PhotoEntity[]>(["photos"], (old) => {
				if (!old) return old;
				// Find the photo in pending and add it to approved
				const pendingPhoto = previousPendingPhotos?.find(p => p.name === filename);
				if (pendingPhoto) {
					return [...old, { ...pendingPhoto, approvalStatus: "approved" }];
				}
				return old;
			});

			return { previousAllPhotos, previousPendingPhotos };
		},
		onError: (_err, _filename, context) => {
			// Rollback on error
			if (context?.previousAllPhotos) {
				queryClient.setQueryData(["photos"], context.previousAllPhotos);
			}
			if (context?.previousPendingPhotos) {
				queryClient.setQueryData(["photos", "pending"], context.previousPendingPhotos);
			}
		},
		onSettled: () => {
			// Refetch in background to ensure data is in sync with server
			// This won't interrupt the user's scroll position
			queryClient.refetchQueries({ queryKey: ["photos"] });
			queryClient.refetchQueries({ queryKey: ["photos", "pending"] });
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
		onMutate: async (filename) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["photos"] });
			await queryClient.cancelQueries({ queryKey: ["photos", "pending"] });

			// Snapshot the previous values
			const previousAllPhotos = queryClient.getQueryData<PhotoEntity[]>(["photos"]);
			const previousPendingPhotos = queryClient.getQueryData<PhotoEntity[]>(["photos", "pending"]);

			// Optimistically update both caches
			queryClient.setQueryData<PhotoEntity[]>(["photos", "pending"], (old) => {
				if (!old) return old;
				return old.map(photo =>
					photo.name === filename
						? { ...photo, approvalStatus: "rejected" }
						: photo
				);
			});

			// Remove from approved photos if it was there
			queryClient.setQueryData<PhotoEntity[]>(["photos"], (old) => {
				if (!old) return old;
				return old.filter(photo => photo.name !== filename);
			});

			return { previousAllPhotos, previousPendingPhotos };
		},
		onError: (_err, _filename, context) => {
			// Rollback on error
			if (context?.previousAllPhotos) {
				queryClient.setQueryData(["photos"], context.previousAllPhotos);
			}
			if (context?.previousPendingPhotos) {
				queryClient.setQueryData(["photos", "pending"], context.previousPendingPhotos);
			}
		},
		onSettled: () => {
			// Refetch in background to ensure data is in sync with server
			// This won't interrupt the user's scroll position
			queryClient.refetchQueries({ queryKey: ["photos"] });
			queryClient.refetchQueries({ queryKey: ["photos", "pending"] });
		},
	});
}
