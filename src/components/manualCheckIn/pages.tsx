import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import {
	getAllEvents,
	EventEntity,
	getAllUsers,
	UserEntity,
} from "@/common/api";
import { checkInUserToEvent } from "@/common/api"; // Adjust import as necessary
import { useFirebase } from "@/components/context";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
	return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
Alert.displayName = "Alert";

const ManualCheckIn: React.FC = () => {
	const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
	const [users, setUsers] = useState<UserEntity[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [events, setEvents] = useState<EventEntity[]>([]);
	const [message, setMessage] = useState<string>("");
	const [openSnackbar, setOpenSnackbar] = useState(false);
	const { user } = useFirebase();
	const [isAuthResolved, setIsAuthResolved] = useState(false);

	useEffect(() => {
		const checkAuthState = async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (user !== undefined) {
				setIsAuthResolved(true);
			}
		};

		checkAuthState();
	}, [user]);

	useEffect(() => {
		const fetchData = async () => {
			if (isAuthResolved && user) {
				const fetchedEvents = await getAllEvents();
				setEvents(fetchedEvents.data);
				const fetchedUsers = await getAllUsers();
				setUsers(fetchedUsers.data);
			}
		};

		fetchData();
	}, [isAuthResolved, user]);

	const handleCheckIn = async () => {
		if (!user || !selectedUser || !selectedEvent) {
			setMessage("Missing information");
			setOpenSnackbar(true);
			return;
		}

		try {
			await checkInUserToEvent(
				{ organizerId: user.uid },
				{ userId: selectedUser.id, eventId: selectedEvent }
			);
			setMessage(
				`${selectedUser.firstName} ${selectedUser.lastName} checked in successfully`
			);
			setOpenSnackbar(true);
		} catch (error) {
			console.error("Check-in failed", error);
			setMessage("Check-in failed");
			setOpenSnackbar(true);
		}
	};

	return (
		<Container maxWidth="sm">
			<Typography variant="h6" gutterBottom>
				Manual User Check-In
			</Typography>
			<Autocomplete
				options={users}
				getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
				onChange={(event, newValue) => {
					setSelectedUser(newValue);
				}}
				renderInput={(params) => <TextField {...params} label="Search User" />}
				fullWidth
			/>
			<FormControl fullWidth margin="normal">
				<InputLabel>Select Event</InputLabel>
				<Select
					value={selectedEvent}
					onChange={(e) => setSelectedEvent(e.target.value as string)}
				>
					{events.map((event) => (
						<MenuItem key={event.id} value={event.id}>
							{event.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<Box display="flex" justifyContent="center" marginTop={2}>
				<Button variant="outlined" onClick={handleCheckIn}>
					Check In User
				</Button>
			</Box>
			<Snackbar
				open={openSnackbar}
				autoHideDuration={3000}
				onClose={() => setOpenSnackbar(false)}
			>
				<Alert
					severity={message.includes("successfully") ? "success" : "error"}
					onClose={() => setOpenSnackbar(false)}
					key="alert"
					sx={{ width: "100%" }}
				>
					{message}
				</Alert>
			</Snackbar>
		</Container>
	);
};

export default ManualCheckIn;
