import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllLocations,
	getLocation,
	createLocation,
	updateLocation,
	replaceLocation,
	deleteLocation,
} from "./provider";
import {
	LocationEntity,
	LocationCreateEntity,
	LocationUpdateEntity,
} from "./entity";

export const locationQueryKeys = {
	all: ["locations"] as const,
	detail: (id: number) => ["locations", id] as const,
};

export function useAllLocations() {
	return useQuery<LocationEntity[]>({
		queryKey: locationQueryKeys.all,
		queryFn: getAllLocations,
	});
}

export function useLocation(id: number) {
	return useQuery<LocationEntity>({
		queryKey: locationQueryKeys.detail(id),
		queryFn: () => getLocation(id),
		enabled: Boolean(id),
	});
}

export function useCreateLocation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: LocationCreateEntity) => createLocation(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationQueryKeys.all });
		},
	});
}

export function useUpdateLocation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: LocationUpdateEntity }) =>
			updateLocation(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationQueryKeys.all });
		},
	});
}

export function useReplaceLocation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: LocationCreateEntity }) =>
			replaceLocation(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationQueryKeys.all });
		},
	});
}

export function useDeleteLocation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteLocation(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationQueryKeys.all });
		},
	});
}
