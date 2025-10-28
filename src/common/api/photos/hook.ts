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
	{ file: File; fileType?: string }
> {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ file, fileType }) => uploadPhoto(file, fileType),
		onSuccess: (data) => {
			// Optimistically add the new photo to pending cache
			queryClient.setQueryData<PhotoEntity[]>(["photos", "pending"], (old) => {
				if (!old) return old;
				// Add the newly uploaded photo to the pending list
				const newPhoto: PhotoEntity = {
					name: data.photoId,
					url: data.photoUrl,
					createdAt: new Date().toISOString(),
					approvalStatus: "pending",
				};
				return [newPhoto, ...old];
			});
			// Trust the upload response - no need to refetch
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
				// Remove from pending list immediately
				return old.filter(photo => photo.name !== filename);
			});

			queryClient.setQueryData<PhotoEntity[]>(["photos"], (old) => {
				if (!old) return old;
				// Find the photo in pending and add it to the top of approved list
				const pendingPhoto = previousPendingPhotos?.find(p => p.name === filename);
				if (pendingPhoto) {
					return [{ ...pendingPhoto, approvalStatus: "approved" }, ...old];
				}
				return old;
			});

			return { previousAllPhotos, previousPendingPhotos };
		},
		onError: (_err, _filename, context) => {
			// Rollback on error - restore previous state
			if (context?.previousAllPhotos) {
				queryClient.setQueryData(["photos"], context.previousAllPhotos);
			}
			if (context?.previousPendingPhotos) {
				queryClient.setQueryData(["photos", "pending"], context.previousPendingPhotos);
			}
		},
		// No onSettled - trust optimistic update unless error occurs
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
				// Remove from pending list immediately
				return old.filter(photo => photo.name !== filename);
			});

			// Remove from approved photos if it was there
			queryClient.setQueryData<PhotoEntity[]>(["photos"], (old) => {
				if (!old) return old;
				return old.filter(photo => photo.name !== filename);
			});

			return { previousAllPhotos, previousPendingPhotos };
		},
		onError: (_err, _filename, context) => {
			// Rollback on error - restore previous state
			if (context?.previousAllPhotos) {
				queryClient.setQueryData(["photos"], context.previousAllPhotos);
			}
			if (context?.previousPendingPhotos) {
				queryClient.setQueryData(["photos", "pending"], context.previousPendingPhotos);
			}
		},
		// No onSettled - trust optimistic update unless error occurs
	});
}
