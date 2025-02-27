import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllSponsors,
	getSponsor,
	createSponsor,
	updateSponsor,
	replaceSponsor,
	deleteSponsor,
	batchUpdateSponsors,
} from "./provider";
import { SponsorEntity } from "./entity";

export const sponsorQueryKeys = {
	all: ["sponsors"] as const,
	detail: (id: number) => ["sponsor", id] as const,
};

export function useAllSponsors(hackathonId?: string) {
	return useQuery<SponsorEntity[]>({
		queryKey: sponsorQueryKeys.all,
		queryFn: () => getAllSponsors(hackathonId),
	});
}

export function useSponsor(id: number) {
	return useQuery<SponsorEntity>({
		queryKey: sponsorQueryKeys.detail(id),
		queryFn: () => getSponsor(id),
		enabled: Boolean(id),
	});
}

export function useCreateSponsor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (newData: Omit<SponsorEntity, "id">) => createSponsor(newData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sponsorQueryKeys.all });
		},
	});
}

export function useUpdateSponsor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: Partial<Omit<SponsorEntity, "id">>;
		}) => updateSponsor(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: sponsorQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: sponsorQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useReplaceSponsor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: Omit<SponsorEntity, "id">;
		}) => replaceSponsor(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: sponsorQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: sponsorQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useDeleteSponsor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteSponsor(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sponsorQueryKeys.all });
		},
	});
}

export function useBatchUpdateSponsors() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<SponsorEntity>[]) => batchUpdateSponsors(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sponsorQueryKeys.all });
		},
	});
}
