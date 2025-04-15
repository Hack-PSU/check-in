import React, { useState, useEffect, useCallback } from "react";
import {
	Button,
	Container,
	Typography,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
	Snackbar,
	Autocomplete,
	TextField,
	Box,
	Alert,
} from "@mui/material";
import { useFirebase } from "@/components/context";

// Import your new React Query hooks and types
import { useAllEvents, useCheckInEvent } from "@/common/api/event";
import { useAllUsers } from "@/common/api/user";
import { EventEntityResponse, EventType } from "@/common/api/event/entity";
import { UserEntity } from "@/common/api/user/entity";
import { EventEntityResponse } from "@/common/api/event/entity";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";

const ManualCheckIn: React.FC = () => {
	// Local states
	const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	} | null>(null);

	const { user } = useFirebase();

	// 1) Fetch all events
	const {
		data: eventsData,
		isLoading: eventsLoading,
		isError: eventsError,
	} = useAllEvents();

	// 2) Fetch all users
	const {
		data: usersData,
		isLoading: usersLoading,
		isError: usersError,
	} = useAllUsers();

	const { data: hackathonData } = useActiveHackathonForStatic();

	// 3) Mutation for checking in an attendee
	const { mutate: checkInMutate } = useCheckInEvent();

	// If you want to auto-select the first event once events are loaded:
	useEffect(() => {
		if (
			!eventsLoading &&
			eventsData &&
			eventsData.length > 0 &&
			!selectedEvent
		) {
			// Optionally auto-select the first event of type "checkIn", or else the first in the list
			const checkInEvent = eventsData.find(
				(evt) => evt.type === EventType.checkIn
			);
			setSelectedEvent(checkInEvent?.id || eventsData[0].id);
		}
	}, [eventsData, eventsLoading, selectedEvent]);

	const handleCheckIn = useCallback(() => {
		if (!user) {
			setSnackbar({
				open: true,
				message: "You must be logged in to perform this action",
				severity: "error",
			});
			return;
		}
		if (!selectedUser) {
			setSnackbar({
				open: true,
				message: "Please select a user",
				severity: "error",
			});
			return;
		}
		if (!selectedEvent) {
			setSnackbar({
				open: true,
				message: "Please select an event",
				severity: "error",
			});
			return;
		}

		if (!hackathonData) {
			setSnackbar({
				open: true,
				message: "No active hackathon found",
				severity: "error",
			});
			return;
		}

		// Because our useCheckInEvent signature is:
		//   mutationFn: ({ id, userId, data }: { id: string; userId: string; data: CreateScanEntity })
		// We'll pass "selectedEvent" as "id", "selectedUser.id" as "userId", and
		// data as an object that your backend expects (e.g. { organizerId: user.uid }).
		checkInMutate(
			{
				id: selectedEvent,
				userId: selectedUser.id,
				data: {
					hackathonId: hackathonData.id,
					organizerId: user.uid,
				},
			},
			{
				onSuccess: () => {
					setSnackbar({
						open: true,
						message: `${selectedUser.firstName} ${selectedUser.lastName} checked in successfully`,
						severity: "success",
					});
					setSelectedUser(null);
				},
				onError: (err: Error) => {
					console.error("Check-in failed", err);
					setSnackbar({
						open: true,
						message: `Error checking in user: ${err.message}`,
						severity: "error",
					});
				},
			}
		);
	}, [user, selectedUser, selectedEvent, hackathonData, checkInMutate]);

	const handleSnackbarClose = (
		event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === "clickaway") return;
		setSnackbar(null);
	};

	// Convert undefined data into empty arrays to avoid optional chaining
	const events: EventEntityResponse[] = eventsData ?? [];
	const users: UserEntity[] = usersData ?? [];

	return (
		<Container maxWidth="sm" sx={{ marginTop: 4 }}>
			<Typography variant="h6" gutterBottom>
				Manual User Check-In
			</Typography>

			{/* Loading / Error states for events and users */}
			{(eventsLoading || usersLoading) && (
				<Typography>Loading events and users...</Typography>
			)}
			{(eventsError || usersError) && (
				<Alert severity="error">
					Error fetching events or users. Please try again later.
				</Alert>
			)}

			{/* 1) Autocomplete to select user */}
			<Autocomplete
				options={users}
				value={selectedUser}
				onChange={(event, newValue) => setSelectedUser(newValue)}
				getOptionLabel={(option) =>
					`${option.firstName} ${option.lastName} (${option.email})`
				}
				renderInput={(params) => (
					<TextField {...params} label="Search User" variant="outlined" />
				)}
				fullWidth
				sx={{ marginTop: 2 }}
				disabled={usersLoading || usersError !== false}
			/>

			{/* 2) Select for event */}
			<FormControl fullWidth sx={{ marginTop: 2 }}>
				<InputLabel id="event-select-label">Select Event</InputLabel>
				<Select
					labelId="event-select-label"
					value={selectedEvent}
					onChange={(e) => setSelectedEvent(e.target.value as string)}
					label="Select Event"
					disabled={eventsLoading || eventsError !== false}
				>
					{events.map((event) => (
						<MenuItem key={event.id} value={event.id}>
							{event.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>

			{/* 3) Check-In button */}
			<Box display="flex" justifyContent="center" marginTop={3}>
				<Button
					variant="contained"
					color="primary"
					onClick={handleCheckIn}
					disabled={!selectedUser || !selectedEvent}
				>
					Check In User
				</Button>
			</Box>

			{/* Snackbar Notifications */}
			{snackbar && (
				<Snackbar
					open={snackbar.open}
					autoHideDuration={3000}
					onClose={handleSnackbarClose}
				>
					<Alert
						severity={snackbar.severity}
						onClose={handleSnackbarClose}
						sx={{ width: "100%" }}
					>
						{snackbar.message}
					</Alert>
				</Snackbar>
			)}
		</Container>
	);
};

export default ManualCheckIn;
