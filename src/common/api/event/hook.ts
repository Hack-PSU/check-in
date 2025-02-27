import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllEvents,
	getEvent,
	createEvent,
	updateEvent,
	replaceEvent,
	deleteEvent,
	subscribeToEvent,
	unsubscribeFromEvent,
	checkInEvent,
} from "./provider";
import { EventEntityResponse, CreateScanEntity } from "./entity";

export const eventQueryKeys = {
	all: (hackathonId?: string) => ["events", hackathonId] as const,
	detail: (id: string) => ["event", id] as const,
};

export function useAllEvents(hackathonId?: string) {
	return useQuery<EventEntityResponse[]>({
		queryKey: eventQueryKeys.all(hackathonId),
		queryFn: () => getAllEvents(hackathonId),
	});
}

export function useEvent(id: string) {
	return useQuery<EventEntityResponse>({
		queryKey: eventQueryKeys.detail(id),
		queryFn: () => getEvent(id),
		enabled: Boolean(id),
	});
}

export function useCreateEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: FormData) => createEvent(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all() });
		},
	});
}

export function useUpdateEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) =>
			updateEvent(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all() });
			queryClient.invalidateQueries({
				queryKey: eventQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useReplaceEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) =>
			replaceEvent(id, data),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all() });
			queryClient.invalidateQueries({
				queryKey: eventQueryKeys.detail(updated.id),
			});
		},
	});
}

export function useDeleteEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteEvent(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all() });
		},
	});
}

export function useSubscribeToEvent() {
	return useMutation({
		mutationFn: (id: string) => subscribeToEvent(id),
	});
}

export function useUnsubscribeFromEvent() {
	return useMutation({
		mutationFn: (id: string) => unsubscribeFromEvent(id),
	});
}

export function useCheckInEvent() {
	return useMutation({
		mutationFn: ({
			id,
			userId,
			data,
		}: {
			id: string;
			userId: string;
			data: CreateScanEntity;
		}) => checkInEvent(id, userId, data),
	});
}
