"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	Button,
	Typography,
	Alert,
	Container,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
	Snackbar,
} from "@mui/material";
import jsQR from "jsqr";
import {
	getAllEvents,
	checkInUsersByEvent,
	EventEntity,
	EventType,
} from "@/common/api";
import { useFirebase } from "@/components/context";
import ManualCheckIn from "@/components/manualCheckIn/page";
import { useRouter } from "next/navigation";

const ScanPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const router = useRouter();
	const [events, setEvents] = useState<EventEntity[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	} | null>(null);
	const { user, isLoading, logout } = useFirebase();

	// Start camera on component mount and stop on unmount
	useEffect(() => {
		let stream: MediaStream;

		const startCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "environment" },
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (error) {
				console.error("Error accessing the camera", error);
				setSnackbar({
					open: true,
					message: "Error accessing the camera",
					severity: "error",
				});
			}
		};

		startCamera();

		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	// Fetch events on component mount
	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const fetchedEvents = await getAllEvents();
				setEvents(fetchedEvents.data);
				if (fetchedEvents.data.length > 0) {
					const checkinEvent = fetchedEvents.data.find(
						(event) => event.type === EventType.CHECKIN
					);
					setSelectedEvent(checkinEvent?.id || fetchedEvents.data[0].id);
				}
			} catch (error) {
				console.error("Error fetching events", error);
				setSnackbar({
					open: true,
					message: "Error fetching events",
					severity: "error",
				});
			}
		};

		fetchEvents();
	}, []);

	// Redirect if user is signed out
	useEffect(() => {
		if (!user && !isLoading) {
			logout();
			router.push("/auth");
		}
	}, [user, isLoading, logout, router]);

	const handleEventChange = (event: React.ChangeEvent<{ value: unknown }>) => {
		setSelectedEvent(event.target.value as string);
	};

	const handleSnackbarClose = (
		event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === "clickaway") return;
		setSnackbar(null);
	};

	const checkInUser = useCallback(
		async (userId: string) => {
			if (!selectedEvent) {
				setSnackbar({
					open: true,
					message: "Please select an event",
					severity: "error",
				});
				return;
			}
			try {
				if (!user) {
					await logout();
					router.push("/auth");
					return;
				}

				await checkInUsersByEvent(
					{ organizerId: user.uid },
					{ eventId: selectedEvent, userId }
				);

				const eventName =
					events.find((event) => event.id === selectedEvent)?.name ||
					selectedEvent;

				setSnackbar({
					open: true,
					message: `User ${userId} checked in successfully to event ${eventName}`,
					severity: "success",
				});
			} catch (error) {
				console.error("Check-in failed", error);
				setSnackbar({
					open: true,
					message: "Check-in failed",
					severity: "error",
				});
			}
		},
		[selectedEvent, user, events, logout, router]
	);

	const captureAndScanImage = async () => {
		if (!videoRef.current) return;

		const canvas = document.createElement("canvas");
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");

		if (ctx) {
			ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code) {
				const userId = code.data.replace("HACKPSU_", "");
				await checkInUser(userId);
			} else {
				setSnackbar({
					open: true,
					message: "No QR code detected",
					severity: "error",
				});
			}
		} else {
			setSnackbar({
				open: true,
				message: "Error processing the image",
				severity: "error",
			});
		}
	};

	const formatDate = (time: number): string => {
		return new Date(time).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Container maxWidth="sm" sx={{ paddingTop: 4, paddingBottom: 4 }}>
			<Typography variant="h5" component="h1" gutterBottom align="center">
				QR Code Scanner
			</Typography>

			<FormControl fullWidth margin="normal">
				<InputLabel id="event-select-label">Select Event</InputLabel>
				<Select
					labelId="event-select-label"
					value={selectedEvent}
					onChange={handleEventChange}
					label="Select Event"
				>
					{events.map((event) => (
						<MenuItem key={event.id} value={event.id}>
							<div>
								<Typography variant="body1">{event.name}</Typography>
								<Typography variant="body2" color="textSecondary">
									{formatDate(event.startTime)} - {formatDate(event.endTime)}
								</Typography>
							</div>
						</MenuItem>
					))}
				</Select>
			</FormControl>

			<div
				style={{
					width: "100%",
					maxWidth: 600,
					overflow: "hidden",
					borderRadius: 8,
					marginTop: 16,
				}}
			>
				<video
					ref={videoRef}
					autoPlay
					muted
					playsInline
					style={{ width: "100%" }}
				/>
			</div>

			<Button
				variant="outlined"
				color="primary"
				onClick={captureAndScanImage}
				sx={{ marginTop: 2 }}
				fullWidth
			>
				Scan QR Code
			</Button>

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

export default ScanPage;
