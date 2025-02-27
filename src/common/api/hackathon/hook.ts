import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllHackathons,
	getHackathon,
	createHackathon,
	updateHackathon,
	replaceHackathon,
	deleteHackathon,
	markActiveHackathon,
	getActiveHackathonForStatic,
} from "./provider";
import {
	HackathonEntity,
	HackathonCreateEntity,
	HackathonUpdateEntity,
	StaticActiveHackathonEntity,
} from "./entity";

export const hackathonQueryKeys = {
	all: ["hackathons"] as const,
	detail: (id: string) => ["hackathon", id] as const,
	activeStatic: ["hackathon", "active", "static"] as const,
};

export function useAllHackathons(active?: boolean) {
	return useQuery<HackathonEntity[]>({
		queryKey:
			active !== undefined
				? [...hackathonQueryKeys.all, active]
				: hackathonQueryKeys.all,
		queryFn: () => getAllHackathons(active),
	});
}

export function useHackathon(id: string) {
	return useQuery<HackathonEntity>({
		queryKey: hackathonQueryKeys.detail(id),
		queryFn: () => getHackathon(id),
		enabled: Boolean(id),
	});
}

export function useCreateHackathon() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: HackathonCreateEntity) => createHackathon(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: hackathonQueryKeys.all });
		},
	});
}

export function useUpdateHackathon() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: HackathonUpdateEntity }) =>
			updateHackathon(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: hackathonQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: hackathonQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useReplaceHackathon() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: HackathonCreateEntity }) =>
			replaceHackathon(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: hackathonQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: hackathonQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useDeleteHackathon() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteHackathon(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: hackathonQueryKeys.all });
		},
	});
}

export function useMarkActiveHackathon() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => markActiveHackathon(id),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: hackathonQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: hackathonQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useActiveHackathonForStatic() {
	return useQuery<StaticActiveHackathonEntity>({
		queryKey: hackathonQueryKeys.activeStatic,
		queryFn: getActiveHackathonForStatic,
	});
}
