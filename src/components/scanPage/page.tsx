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
	SelectChangeEvent,
} from "@mui/material";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";

// Firebase/Auth context (or any other user-auth system)
import { useFirebase } from "@/components/context";

// React Query hooks for events
import { useAllEvents, useCheckInEvent } from "@/common/api/event";
import { EventEntityResponse, EventType } from "@/common/api/event/entity";
import { useActiveHackathonForStatic } from "@/common/api/hackathon/hook";

// Optional: If your backend expects extra fields in the payload
// import { CreateScanEntity } from "@/common/api/events/entity";

const ScanPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const router = useRouter();
	const { user, isLoading, logout } = useFirebase();

	// Selected event from the dropdown
	const [selectedEvent, setSelectedEvent] = useState<string>("");

	// Snackbar for success/error messages
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	} | null>(null);

	// 1) Fetch all events via React Query
	const {
		data: eventsData,
		isLoading: eventsLoading,
		isError: eventsError,
	} = useAllEvents();

	const { data: hackathonData } = useActiveHackathonForStatic();

	// 2) Mutation hook for check-in
	const { mutate: checkInMutate } = useCheckInEvent();

	// If user is not logged in, redirect to auth page
	useEffect(() => {
		if (!user && !isLoading) {
			logout();
			router.push("/auth");
		}
	}, [user, isLoading, logout, router]);

	// Start camera on mount, stop on unmount
	useEffect(() => {
		let stream: MediaStream | null = null;

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

	// Once events load, pick the default event
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

	const handleEventChange = (event: SelectChangeEvent<string>) => {
		setSelectedEvent(event.target.value as string);
	};

	const handleSnackbarClose = (
		event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === "clickaway") return;
		setSnackbar(null);
	};

	// Check-in logic using the mutation hook
	const handleCheckIn = useCallback(
		(scannedUserId: string) => {
			if (!user) {
				logout();
				router.push("/auth");
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

			// Call our mutation
			checkInMutate(
				{
					id: selectedEvent, // event ID
					userId: scannedUserId, // user ID from QR code
					data: {
						hackathonId: hackathonData.id,
						organizerId: user.uid, // or any other data your backend expects
					},
				},
				{
					onSuccess: () => {
						const eventName =
							eventsData?.find((evt) => evt.id === selectedEvent)?.name ||
							selectedEvent;
						setSnackbar({
							open: true,
							message: `User ${scannedUserId} checked in successfully to ${eventName}`,
							severity: "success",
						});
					},
					onError: (err) => {
						console.error("Check-in failed", err);
						setSnackbar({
							open: true,
							message: "Check-in failed",
							severity: "error",
						});
					},
				}
			);
		},
		[
			user,
			selectedEvent,
			hackathonData,
			checkInMutate,
			logout,
			router,
			eventsData,
		]
	);

	// Capture current video frame & scan for QR code
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
				// Example: your QR code might look like "HACKPSU_userId"
				const userId = code.data.replace("HACKPSU_", "");
				handleCheckIn(userId);
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

	// Simple time formatting
	const formatDate = (time: number): string => {
		return new Date(time).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Handle loading / error states for events
	if (eventsLoading) {
		return (
			<Container maxWidth="sm">
				<Typography>Loading events...</Typography>
			</Container>
		);
	}
	if (eventsError) {
		return (
			<Container maxWidth="sm">
				<Alert severity="error">Error loading events. Please try again.</Alert>
			</Container>
		);
	}

	const events = eventsData ?? [];

	return (
		<Container maxWidth="sm" sx={{ paddingTop: 4, paddingBottom: 4 }}>
			<Typography variant="h5" component="h1" gutterBottom align="center">
				QR Code Scanner
			</Typography>

			{/* Event Select */}
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

			{/* Camera View */}
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

			{/* Scan Button */}
			<Button
				variant="outlined"
				color="primary"
				onClick={captureAndScanImage}
				sx={{ marginTop: 2 }}
				fullWidth
			>
				Scan QR Code
			</Button>

			{/* Snackbar */}
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
