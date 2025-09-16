"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandItem,
} from "@/components/ui/command";
import { Toaster, toast } from "sonner";
import { useAllEvents, useCheckInEvent } from "@/common/api/event";
import { useAllUsers } from "@/common/api/user";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";
import { useFirebase } from "@/common/context";

interface FormValues {
	userId: string;
	eventId: string;
}

export default function ManualCheckIn() {
	const { user } = useFirebase();
	const {
		data: events = [],
		isLoading: eventsLoading,
		isError: eventsError,
	} = useAllEvents();
	const {
		data: users = [],
		isLoading: usersLoading,
		isError: usersError,
	} = useAllUsers();
	const { data: hackathon } = useActiveHackathonForStatic();
	const { mutate: checkInMutate } = useCheckInEvent();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userQuery, setUserQuery] = useState("");
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const { control, handleSubmit, watch, resetField, setValue } =
		useForm<FormValues>({
			defaultValues: { userId: "", eventId: "" },
		});

	const selectedUserId = watch("userId");
	const selectedEventId = watch("eventId");

	const selectedUser = useMemo(
		() => users.find((u) => u.id === selectedUserId),
		[users, selectedUserId]
	);
	const selectedEvent = useMemo(
		() => events.find((e) => e.id === selectedEventId),
		[events, selectedEventId]
	);

	const formatTimeRange = (start: number, end: number) => {
		const startDt = new Date(start);
		const endDt = new Date(end);
		const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
		return `${startDt.toLocaleTimeString(undefined, timeOpts)}–${endDt.toLocaleTimeString(undefined, timeOpts)}`;
	};

	const formatDateTimeRange = (start: number, end: number) => {
		const startDt = new Date(start);
		const endDt = new Date(end);
		const sameDay = startDt.toDateString() === endDt.toDateString();
		const dateOpts: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
		const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
		if (sameDay) {
			return `${startDt.toLocaleDateString(undefined, dateOpts)} ${startDt.toLocaleTimeString(undefined, timeOpts)}–${endDt.toLocaleTimeString(undefined, timeOpts)}`;
		}
		return `${startDt.toLocaleDateString(undefined, dateOpts)} ${startDt.toLocaleTimeString(undefined, timeOpts)} – ${endDt.toLocaleDateString(undefined, dateOpts)} ${endDt.toLocaleTimeString(undefined, timeOpts)}`;
	};

	// Improved search filtering with better text matching
	const filteredUsers = useMemo(() => {
		if (!userQuery.trim()) return users;

		const searchTerm = userQuery.toLowerCase().trim();

		return users.filter((u) => {
			const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
			const email = u.email.toLowerCase();
			const firstName = u.firstName.toLowerCase();
			const lastName = u.lastName.toLowerCase();

			return (
				fullName.includes(searchTerm) ||
				email.includes(searchTerm) ||
				firstName.includes(searchTerm) ||
				lastName.includes(searchTerm) ||
				// Also check if search term matches parts of the name
				searchTerm
					.split(" ")
					.every((term) => fullName.includes(term) || email.includes(term))
			);
		});
	}, [users, userQuery]);

	// Clear search when user is selected
	const handleUserSelect = (userId: string) => {
		setValue("userId", userId);
		setUserQuery("");
		setIsPopoverOpen(false);
	};

	// Clear user selection when search input is manually cleared
	const handleSearchChange = (value: string) => {
		setUserQuery(value);
		if (!value.trim() && selectedUserId) {
			setValue("userId", "");
		}
	};

	const onSubmit = (data: FormValues) => {
		if (!user) {
			toast.error("You must be logged in to perform this action.");
			return;
		}

		if (!hackathon) {
			toast.error("No active hackathon found.");
			return;
		}

		setIsSubmitting(true);
		checkInMutate(
			{
				id: data.eventId,
				userId: data.userId,
				data: { hackathonId: hackathon.id, organizerId: user.uid },
			},
			{
				onSuccess: () => {
					toast.success(
						`${selectedUser?.firstName} ${selectedUser?.lastName} checked in!`
					);
					resetField("userId");
					setUserQuery("");
				},
				onError: (err: any) => {
					console.error(err);
					toast.error(`Error: ${err.message || err}`);
				},
				onSettled: () => setIsSubmitting(false),
			}
		);
	};

	return (
		<>
			<Toaster position="bottom-right" richColors />
			<div className="min-h-screen flex items-center justify-center p-4 pb-24">
				<Card className="w-full max-w-lg">
					<CardContent className="space-y-6 p-6">
						<h2 className="text-xl font-semibold">Manual User Check-In</h2>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							{/* User Search Popover */}
							<div>
								<Label htmlFor="user-popover">Search User</Label>
								<Controller
									name="userId"
									control={control}
									render={({ field }) => (
										<Popover>
											<PopoverTrigger asChild>
												<Input
													id="user-popover"
													placeholder="Search by name or email"
													value={
														selectedUser && !isPopoverOpen
															? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
															: userQuery
													}
													onChange={(e) => {
														handleSearchChange(e.target.value);
														if (!isPopoverOpen) setIsPopoverOpen(true);
													}}
													onFocus={() => setIsPopoverOpen(true)}
													className="w-full cursor-pointer text-left"
												/>
											</PopoverTrigger>
											<PopoverContent
												side="bottom"
												align="start"
												className="w-[var(--radix-popover-trigger-width)] p-0"
												sideOffset={4}
											>
												<Command shouldFilter={false}>
													<CommandInput
														placeholder="Type a name or email..."
														value={userQuery}
														onValueChange={handleSearchChange}
														className="border-none focus:ring-0"
													/>
													<CommandList className="max-h-[200px]">
														{usersLoading ? (
															<div className="p-4 text-sm text-muted-foreground text-center">
																Loading users...
															</div>
														) : filteredUsers.length === 0 ? (
															<CommandEmpty>
																{userQuery.trim()
																	? "No users found."
																	: "Start typing to search users."}
															</CommandEmpty>
														) : (
															filteredUsers.map((u) => (
																<CommandItem
																	key={u.id}
																	onSelect={() => handleUserSelect(u.id)}
																	className="cursor-pointer"
																>
																	<div className="flex flex-col">
																		<span className="font-medium">
																			{u.firstName} {u.lastName}
																		</span>
																		<span className="text-sm text-muted-foreground">
																			{u.email}
																		</span>
																	</div>
																</CommandItem>
															))
														)}
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
									)}
								/>
							</div>

							{/* Event Select */}
							<div>
								<Label htmlFor="event-select">Select Event</Label>
								<Controller
									name="eventId"
									control={control}
									render={({ field }) => (
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={eventsLoading || eventsError}
										>
											<SelectTrigger id="event-select" className="w-full">
												<SelectValue placeholder="Choose an event" />
											</SelectTrigger>
											<SelectContent>
												{eventsLoading ? (
													<div className="p-4 text-sm text-muted-foreground text-center">
														Loading events...
													</div>
												) : events.length === 0 ? (
													<div className="p-4 text-sm text-muted-foreground text-center">
														No events available
													</div>
												) : (
													events.map((e) => (
														<SelectItem key={e.id} value={e.id}>
															{e.name} ({formatTimeRange(e.startTime, e.endTime)})
														</SelectItem>
													))
												)}
											</SelectContent>
										</Select>
									)}
								/>
							</div>

							{selectedEvent && null}

							{/* Check-In Button */}
							<Button
								type="submit"
								className="w-full"
								disabled={!selectedUserId || !selectedEventId || isSubmitting}
							>
								{isSubmitting ? "Checking In..." : "Check In User"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
