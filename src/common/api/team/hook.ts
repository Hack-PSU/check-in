import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllTeams,
	getTeam,
	createTeam,
	updateTeam,
	addUserByEmail,
	deleteTeam,
} from "./provider";
import {
	TeamEntity,
	TeamCreateEntity,
	TeamUpdateEntity,
	AddUserByEmailEntity,
} from "./entity";

export const teamQueryKeys = {
	all: (active?: boolean) =>
		active !== undefined
			? (["teams", { active }] as const)
			: (["teams"] as const),
	detail: (id: string) => ["teams", id] as const,
};

export function useAllTeams(active?: boolean) {
	return useQuery<TeamEntity[]>({
		queryKey: teamQueryKeys.all(active),
		queryFn: () => getAllTeams(active),
	});
}

export function useTeam(id: string) {
	return useQuery<TeamEntity>({
		queryKey: teamQueryKeys.detail(id),
		queryFn: () => getTeam(id),
		enabled: Boolean(id),
	});
}

export function useCreateTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: TeamCreateEntity) => createTeam(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamQueryKeys.all() });
		},
	});
}

export function useUpdateTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: TeamUpdateEntity }) =>
			updateTeam(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: teamQueryKeys.all() });
			queryClient.invalidateQueries({
				queryKey: teamQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useAddUserByEmail() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: AddUserByEmailEntity }) =>
			addUserByEmail(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: teamQueryKeys.all() });
			queryClient.invalidateQueries({
				queryKey: teamQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useDeleteTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteTeam(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamQueryKeys.all() });
		},
	});
}
