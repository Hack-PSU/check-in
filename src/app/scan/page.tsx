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

// Firebase/Auth context (or any other user-auth system)
import { useFirebase } from "@/common/context";

// React Query hooks for events
import { useAllEvents, useCheckInEvent } from "@/common/api/event";
import { EventEntityResponse, EventType } from "@/common/api/event/entity";
import { useActiveHackathonForStatic } from "@/common/api/hackathon/hook";

// Optional: If your backend expects extra fields in the payload
// import { CreateScanEntity } from "@/common/api/events/entity";

const ScanPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const { user, isLoading, logout } = useFirebase();

	// Selected event from the dropdown
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [isAutoScanning, setIsAutoScanning] = useState<boolean>(true);
	const [lastSuccessfulScanTime, setLastSuccessfulScanTime] = useState<number>(0);
	const autoScanInterval = 2000; // ms
	const scanPauseDuration = 10000; // ms, pause after successful scan
	const [userFeedback, setUserFeedback] = useState<string>(
		"Initializing scanner..."
	);

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

	// Effect to resume auto-scanning after a pause
	useEffect(() => {
		if (lastSuccessfulScanTime > 0) {
			const timer = setTimeout(() => {
				setIsAutoScanning(true);
				setUserFeedback("Scanning..."); // Feedback when resuming
			}, scanPauseDuration);
			return () => clearTimeout(timer);
		}
	}, [lastSuccessfulScanTime, scanPauseDuration]);

	// Once events load, pick the default event, set initial feedback
	useEffect(() => {
		if (!eventsLoading && eventsData && eventsData.length > 0) {
			if (!selectedEvent) {
				const checkInEvent = eventsData.find(
					(evt) => evt.type === EventType.checkIn
				);
				const defaultEventId = checkInEvent?.id || eventsData[0].id;
				setSelectedEvent(defaultEventId);
				setUserFeedback("Align QR code in the box to scan."); // Default happy path
			}
		} else if (!eventsLoading && (!eventsData || eventsData.length === 0)) {
			setUserFeedback("No events available to scan for. Please create an event.");
			setIsAutoScanning(false);
		}
	}, [eventsData, eventsLoading, selectedEvent]);

	const handleEventChange = (event: SelectChangeEvent<string>) => {
		setSelectedEvent(event.target.value as string);
		// If auto-scanning was off due to no event, and now an event is selected
		if (!isAutoScanning && hackathonData) { // hackathonData check implies basic setup is fine
			setIsAutoScanning(true);
			setUserFeedback("Scanning...");
		} else if (!hackathonData) {
			setUserFeedback("Active hackathon not found. Cannot start scanning.");
			setIsAutoScanning(false);
		}
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
				logout(); // This should ideally redirect or show a blocking message
				setUserFeedback("User not authenticated. Please log in.");
				setIsAutoScanning(false);
				return;
			}

			if (!selectedEvent) {
				const msg = "Please select an event to scan for.";
				if (isAutoScanning) {
					setUserFeedback(msg);
					setIsAutoScanning(false);
				} else {
					setSnackbar({ open: true, message: msg, severity: "error" });
				}
				return;
			}

			if (!hackathonData) {
				const msg = "No active hackathon found. Cannot record scan.";
				if (isAutoScanning) {
					setUserFeedback(msg);
					setIsAutoScanning(false);
				} else {
					setSnackbar({ open: true, message: msg, severity: "error" });
				}
				return;
			}

			setUserFeedback("Processing check-in..."); // Feedback before mutation
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
						setLastSuccessfulScanTime(Date.now());
						setIsAutoScanning(false); // Pause auto-scan
						setUserFeedback(
							`Success! ${scannedUserId} checked into ${eventName}. Auto-scan paused.`
						);
					},
					onError: (err) => {
						console.error("Check-in failed", err);
						const errorMsg = `Error checking in: ${err.message}.`;
						setSnackbar({
							open: true,
							message: errorMsg,
							severity: "error",
						});
						setUserFeedback(errorMsg + " Ready to try again.");
						// Potentially allow auto-scan to continue if it's a transient backend error
						// For now, it will resume after standard pause or manual click
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
			eventsData,
			isAutoScanning,
			setUserFeedback, // Added setUserFeedback
		]
	);

	// Capture current video frame & scan for QR code
	const captureAndScanImage = useCallback(async () => {
		if (!videoRef.current || !videoRef.current.videoWidth) {
			setUserFeedback("Video stream not available.");
			return false;
		}

		// No need to set "Scanning..." here if auto-scan effect does it.
		// However, for manual scans, this is a good place.
		if (!isAutoScanning) {
			setUserFeedback("Attempting manual scan...");
		}

		const canvas = document.createElement("canvas");
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");

		if (ctx) {
			ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code && code.data) {
				setUserFeedback("QR code detected, processing...");
				const userId = code.data.replace("HACKPSU_", ""); // Example prefix
				handleCheckIn(userId);
				return true;
			} else {
				if (isAutoScanning) {
					setUserFeedback("Searching for QR code..."); // Continuous feedback for auto-scan
				} else {
					// Manual scan specific feedback for no QR
					setSnackbar({
						open: true,
						message: "No QR code detected on manual scan.",
						severity: "error",
					});
					setUserFeedback("No QR code found. Try again or adjust camera.");
				}
				return false;
			}
		} else {
			setUserFeedback("Error processing image from camera.");
			setSnackbar({
				open: true,
				message: "Error processing the image",
				severity: "error",
			});
			return false;
		}
	}, [videoRef, handleCheckIn, isAutoScanning, setUserFeedback]); // Added deps

	// Auto-scanning logic
	useEffect(() => {
		// Update initial feedback based on state
		if (!selectedEvent && eventsData && eventsData.length > 0) {
			setUserFeedback("Please select an event to begin scanning.");
			setIsAutoScanning(false);
		} else if (isAutoScanning) {
			setUserFeedback("Scanning...");
		}


		let intervalId: NodeJS.Timeout | null = null;

		if (isAutoScanning) {
			intervalId = setInterval(async () => {
				const now = Date.now();
				if (now > lastSuccessfulScanTime + scanPauseDuration) {
					// setUserFeedback("Scanning..."); // Set before each attempt in auto-scan
					await captureAndScanImage();
				}
			}, autoScanInterval);
		} else {
			if (intervalId) {
				clearInterval(intervalId);
			}
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [
		isAutoScanning,
		lastSuccessfulScanTime,
		captureAndScanImage,
		autoScanInterval,
		scanPauseDuration,
		selectedEvent,
		eventsData,
		setUserFeedback, // Added setUserFeedback
	]);

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
					position: "relative", // Added for overlay positioning
				}}
			>
				<video
					ref={videoRef}
					autoPlay
					muted
					playsInline
					style={{ width: "100%", display: "block" }} // Added display: block
				/>
				{/* QR Code Guideline Overlay */}
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						style={{
							width: "60%", // Relative size for responsiveness
							paddingBottom: "60%", // Aspect ratio 1:1
							border: "2px dashed white",
							boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)", // Cut-out effect
							borderRadius: "8px", // Optional: if you want rounded corners for the guideline itself
						}}
					/>
				</div>
			</div>

			{/* User Feedback Display */}
			{userFeedback && (
				<Typography
					variant="body1"
					align="center"
					sx={{ marginTop: 2, minHeight: "1.5em" }} // minHeight to prevent layout shift
				>
					{userFeedback}
				</Typography>
			)}

			{/* Scan Button */}
			<Button
				variant="outlined"
				color="primary"
				onClick={async () => {
					setIsAutoScanning(false); // Stop auto-scan on manual intervention
					setUserFeedback("Manual scan initiated...");
					const success = await captureAndScanImage();
					if (success) {
						// Feedback is handled by captureAndScanImage / handleCheckIn
					} else if (!isAutoScanning) { // If still not auto-scanning (i.e. not resumed by success)
						setUserFeedback(
							"Manual scan did not find a QR code. Auto-scan is off."
						);
					}
				}}
				sx={{ marginTop: 1 }} // Reduced margin a bit to accommodate feedback text
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
