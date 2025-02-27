import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllOrganizers,
	getOrganizer,
	createOrganizer,
	updateOrganizer,
	deleteOrganizer,
} from "./provider";
import { OrganizerEntity } from "./entity";

export const organizerQueryKeys = {
	all: ["organizers"] as const,
	detail: (id: string) => ["organizer", id] as const,
};

export function useAllOrganizers() {
	return useQuery<OrganizerEntity[]>({
		queryKey: organizerQueryKeys.all,
		queryFn: getAllOrganizers,
	});
}

export function useOrganizer(id: string) {
	return useQuery<OrganizerEntity>({
		queryKey: organizerQueryKeys.detail(id),
		queryFn: () => getOrganizer(id),
		enabled: Boolean(id),
	});
}

export function useCreateOrganizer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (newData: Omit<OrganizerEntity, "id">) =>
			createOrganizer(newData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizerQueryKeys.all });
		},
	});
}

export function useUpdateOrganizer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<Omit<OrganizerEntity, "id">>;
		}) => updateOrganizer(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: organizerQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: organizerQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useDeleteOrganizer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteOrganizer(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: organizerQueryKeys.all });
		},
	});
}
