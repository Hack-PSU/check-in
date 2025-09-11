import {
	useMutation,
	useQuery,
	useQueryClient,
	UseMutationResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { uploadPhoto, getAllPhotos } from "./provider";
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
		},
	});
}

export function useGetAllPhotos(): UseQueryResult<PhotoEntity[], Error> {
	return useQuery({
		queryKey: ["photos"],
		queryFn: getAllPhotos,
	});
}
