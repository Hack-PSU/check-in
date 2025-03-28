import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllFlags,
	getFlagState,
	activateFlag,
	patchFlags,
} from "./provider";
import { FlagEntity, ActivateFlagBody, PatchFlagsBody } from "./entity";

export const flagQueryKeys = {
	all: ["flags"] as const,
	detail: (id: string) => ["flag", id] as const,
};

export function useAllFlags() {
	return useQuery<FlagEntity[]>({
		queryKey: flagQueryKeys.all,
		queryFn: getAllFlags,
		refetchInterval: 1000 * 5, // 5 seconds
	});
}

export function useFlagState(id: string) {
	return useQuery<FlagEntity>({
		queryKey: flagQueryKeys.detail(id),
		queryFn: () => getFlagState(id),
		enabled: Boolean(id),
	});
}

export function useActivateFlag() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: ActivateFlagBody) => activateFlag(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: flagQueryKeys.all });
		},
	});
}

export function usePatchFlags() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PatchFlagsBody) => patchFlags(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: flagQueryKeys.all });
		},
	});
}
