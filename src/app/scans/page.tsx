"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	Button,
	Typography,
	Alert,
	Container,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
	SelectChangeEvent,
	Snackbar,
} from "@mui/material";
import jsQR from "jsqr";
import { getAllEvents, checkInUsersByEvent, EventEntity } from "@/common/api";
import { useFirebase } from "@/components/context";
import ManualCheckIn from "@/components/manualCheckIn/pages";

const ScanPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [scanResult, setScanResult] = useState<string | null>(null);
	const [scanError, setScanError] = useState<string | null>(null);
	const [events, setEvents] = useState<EventEntity[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [IsAuthResolved, setIsAuthResolved] = useState(false);
	const { user, logout } = useFirebase();
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
		const startCamera = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "environment" },
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (error) {
				console.error("Error accessing the camera", error);
				setScanError("Error accessing the camera");
			}
		};

		const redirectIfSignedOut = async () => {
			if (IsAuthResolved && !user) {
				window.location.href = "/auth";
			}
		};

		const fetchEvents = async () => {
			const fetchedEvents = await getAllEvents(); // Adjust according to your API call structure
			setEvents(fetchedEvents.data); // Adjust based on the actual response structure
		};

		startCamera();
		fetchEvents();
		redirectIfSignedOut();
	}, []);

	const handleEventChange = (event: SelectChangeEvent<string>) => {
		setSelectedEvent(event.target.value);
	};

	const handleClose = (
		event: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === "clickaway") {
			return;
		}

		setSnackbarOpen(false);
	};

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
				setScanResult(code.data);
				setScanError(null);
				checkInUser(code.data); // Function to check in the user
				setSnackbarOpen(true);
			} else {
				setScanError("No QR code detected");
				setSnackbarOpen(true);
			}
		} else {
			setScanError("Error processing the image");
			setSnackbarOpen(true);
		}
	};

	const checkInUser = async (userId: string) => {
		if (!selectedEvent) {
			setScanError("Please select an event");
			setSnackbarOpen(true);
			return;
		}
		try {
			if (!user) {
				window.location.href = "/auth";
				return;
			}

			await checkInUsersByEvent(
				{ organizerId: user.uid },
				{ eventId: selectedEvent, userId: userId }
			);
			setScanResult(
				`User ${userId} checked in successfully to event ${
					events.find((event) => event.id === selectedEvent)?.name ||
					selectedEvent
				}`
			);
			setSnackbarOpen(true);
		} catch (error) {
			console.error("Check-in failed", error);
			setScanError("Check-in failed");
		}
	};

	return (
		<Container
			maxWidth="sm"
			className="flex flex-col items-center justify-center h-screen p-4"
		>
			<Typography
				variant="h5"
				component="h1"
				gutterBottom
				className="text-center mb-4"
			>
				QR Code Scanner
			</Typography>
			<FormControl fullWidth className="mb-4">
				<InputLabel id="event-select-label">Select Event</InputLabel>
				<Select
					labelId="event-select-label"
					value={selectedEvent}
					onChange={handleEventChange}
					defaultValue={events.length > 0 ? events[0].id : ""}
					label="Select Event"
				>
					{events.map((event) => (
						<MenuItem key={event.id} value={event.id}>
							{event.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<div className="w-full max-w-lg overflow-hidden rounded-lg shadow-lg">
				<video ref={videoRef} autoPlay muted playsInline className="w-full" />
			</div>
			<Button
				variant="outlined"
				color="primary"
				onClick={captureAndScanImage}
				className="mt-4"
			>
				Scan QR Code
			</Button>
			{scanResult && (
				<Snackbar open={!!scanResult && snackbarOpen} autoHideDuration={3000}>
					<Alert severity="success" className="w-full mt-4">
						Scan Result: {scanResult}
					</Alert>
				</Snackbar>
			)}
			{scanError && (
				<Snackbar
					open={!!scanError && snackbarOpen}
					autoHideDuration={3000}
					onClose={handleClose}
				>
					<Alert severity="error" className="w-full mt-4">
						{scanError}
					</Alert>
				</Snackbar>
			)}

			<div className="manual-checkin-section mt-8">
				<ManualCheckIn />
			</div>
		</Container>
	);
};

export default ScanPage;
