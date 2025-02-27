import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllFinances,
	getFinance,
	createFinance,
	updateFinanceStatus,
} from "./provider";
import { FinanceEntity, FinancePatchEntity } from "./entity";

export const financeQueryKeys = {
	all: ["finances"] as const,
	detail: (id: string) => ["finance", id] as const,
};

export function useAllFinances() {
	return useQuery<FinanceEntity[]>({
		queryKey: financeQueryKeys.all,
		queryFn: getAllFinances,
	});
}

export function useFinance(id: string) {
	return useQuery<FinanceEntity>({
		queryKey: financeQueryKeys.detail(id),
		queryFn: () => getFinance(id),
		enabled: Boolean(id),
	});
}

export function useCreateFinance() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: FormData) => createFinance(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
		},
	});
}

export function useUpdateFinanceStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FinancePatchEntity }) =>
			updateFinanceStatus(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: financeQueryKeys.detail(updated.id),
			});
		},
	});
}
