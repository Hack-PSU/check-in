import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllExtraCreditClasses,
	getExtraCreditClass,
	createExtraCreditClass,
	updateExtraCreditClass,
	replaceExtraCreditClass,
	deleteExtraCreditClass,
	getAllExtraCreditAssignments,
} from "./provider";
import {
	ExtraCreditClassEntity,
	ECClassResponse,
	ECClassCreateEntity,
	ECClassPatchEntity,
	ExtraCreditAssignmentEntity,
} from "./entity";

export const extraCreditQueryKeys = {
	allClasses: ["extra-credit", "classes"] as const,
	classDetail: (id: number) => ["extra-credit", "class", id] as const,
	allAssignments: ["extra-credit", "assignments"] as const,
};

export function useAllExtraCreditClasses() {
	return useQuery<ExtraCreditClassEntity[]>({
		queryKey: extraCreditQueryKeys.allClasses,
		queryFn: getAllExtraCreditClasses,
	});
}

export function useExtraCreditClass(id: number) {
	return useQuery<ECClassResponse>({
		queryKey: extraCreditQueryKeys.classDetail(id),
		queryFn: () => getExtraCreditClass(id),
		enabled: Boolean(id),
	});
}

export function useCreateExtraCreditClass() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (newData: ECClassCreateEntity) =>
			createExtraCreditClass(newData),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: extraCreditQueryKeys.allClasses,
			});
		},
	});
}

export function useUpdateExtraCreditClass() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: ECClassPatchEntity }) =>
			updateExtraCreditClass(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({
				queryKey: extraCreditQueryKeys.allClasses,
			});
			queryClient.invalidateQueries({
				queryKey: extraCreditQueryKeys.classDetail(updated.id),
			});
		},
	});
}

export function useReplaceExtraCreditClass() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: ECClassCreateEntity }) =>
			replaceExtraCreditClass(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({
				queryKey: extraCreditQueryKeys.allClasses,
			});
			queryClient.invalidateQueries({
				queryKey: extraCreditQueryKeys.classDetail(updated.id),
			});
		},
	});
}

export function useDeleteExtraCreditClass() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteExtraCreditClass(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: extraCreditQueryKeys.allClasses,
			});
		},
	});
}

export function useAllExtraCreditAssignments() {
	return useQuery<ExtraCreditAssignmentEntity[]>({
		queryKey: extraCreditQueryKeys.allAssignments,
		queryFn: getAllExtraCreditAssignments,
	});
}
