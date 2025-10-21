import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllReservations,
	getReservation,
	createReservation,
	updateReservation,
	deleteReservation,
	getAllLocations,
} from "./provider";
import {
	ReservationEntity,
	ReservationCreateEntity,
	ReservationUpdateEntity,
} from "./entity";
import { LocationEntity } from "../location/entity";

export const reservationQueryKeys = {
	all: (hackathonId?: string) =>
		hackathonId ? ["reservations", hackathonId] : (["reservations"] as const),
	detail: (id: string) => ["reservations", id] as const,
	locations: ["locations"] as const,
};

export function useReservations(hackathonId?: string) {
	return useQuery<ReservationEntity[]>({
		queryKey: reservationQueryKeys.all(hackathonId),
		queryFn: () => getAllReservations(hackathonId),
	});
}

export function useReservation(id: string) {
	return useQuery<ReservationEntity>({
		queryKey: reservationQueryKeys.detail(id),
		queryFn: () => getReservation(id),
		enabled: Boolean(id),
	});
}

export function useCreateReservation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: ReservationCreateEntity) => createReservation(data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: reservationQueryKeys.all(variables.hackathonId),
			});
			queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all() });
		},
	});
}

export function useUpdateReservation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ReservationUpdateEntity }) =>
			updateReservation(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all() });
			queryClient.invalidateQueries({
				queryKey: reservationQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useCancelReservation(hackathonId?: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteReservation(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: reservationQueryKeys.all(hackathonId),
			});
			queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all() });
		},
	});
}

export function useLocations() {
	return useQuery<LocationEntity[]>({
		queryKey: reservationQueryKeys.locations,
		queryFn: getAllLocations,
	});
}
