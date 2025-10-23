"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { useFirebase } from "@/common/context";
import { useAllEvents, useCheckInEvent } from "@/common/api/event";
import { useActiveHackathonForStatic } from "@/common/api/hackathon/hook";
import { useFlagState } from "@/common/api/flag/hook";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Toaster, toast } from "sonner";

const ScanPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastScannedRef = useRef<string>("");
	const lastScannedTimeRef = useRef<number>(0);

	const { user, logout } = useFirebase();
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [isScanning, setIsScanning] = useState<boolean>(true);
	const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "found">(
		"idle"
	);

	const {
		data: eventsData,
		isLoading: eventsLoading,
		isError: eventsError,
	} = useAllEvents();
	const { data: hackathonData } = useActiveHackathonForStatic();
	const { mutate: checkInMutate } = useCheckInEvent();
	const { data: checkInFlag, isLoading: flagLoading } = useFlagState("CheckIn");

	// Start camera
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
			} catch (err) {
				console.error(err);
				toast.error("Error accessing the camera");
			}
		};
		startCamera();

		return () => {
			if (stream) stream.getTracks().forEach((t) => t.stop());
		};
	}, []);

	// Default event selection
	useEffect(() => {
		if (!eventsLoading && eventsData && eventsData.length && !selectedEvent) {
			const checkInEvt = eventsData.find((e) => e.type === "checkIn");
			setSelectedEvent(checkInEvt?.id || eventsData[0].id);
		}
	}, [eventsLoading, eventsData, selectedEvent]);

	const handleEventChange = useCallback(
		(value: string) => setSelectedEvent(value),
		[]
	);

	const handleCheckIn = useCallback(
		(scannedUserId: string) => {
			if (!user) return void logout();
			if (!selectedEvent) return void toast.error("Please select an event");
			if (!hackathonData) return void toast.error("No active hackathon found");
			if (!checkInFlag?.isEnabled) {
				toast.error("Check-in is currently disabled");
				return;
			}

			// Prevent duplicate scans within 3 seconds
			const now = Date.now();
			if (
				lastScannedRef.current === scannedUserId &&
				now - lastScannedTimeRef.current < 3000
			) {
				return;
			}

			lastScannedRef.current = scannedUserId;
			lastScannedTimeRef.current = now;

			checkInMutate(
				{
					id: selectedEvent,
					userId: scannedUserId,
					data: { hackathonId: hackathonData.id, organizerId: user.uid },
				},
				{
					onSuccess: () => {
						const evtName =
							eventsData?.find((e) => e.id === selectedEvent)?.name || "event";
						toast.success(
							`User ${scannedUserId} checked in successfully to ${evtName}`
						);
						setScanStatus("found");
						setTimeout(() => setScanStatus("scanning"), 1000);
					},
					onError: (err: any) => {
						console.error(err);
						toast.error(`Error checking in user: ${err.message}`);
						setScanStatus("scanning");
					},
				}
			);
		},
		[user, selectedEvent, hackathonData, checkInMutate, logout, eventsData, checkInFlag]
	);

	const captureAndScanImage = useCallback(async () => {
		if (!videoRef.current || !isScanning || !checkInFlag?.isEnabled) return;

		const canvas = document.createElement("canvas");
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");

		if (ctx && canvas.width > 0 && canvas.height > 0) {
			ctx.drawImage(videoRef.current, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code) {
				const userId = code.data.replace("HACKPSU_", "");
				handleCheckIn(userId);
			}
		}
	}, [handleCheckIn, isScanning, checkInFlag]);

	// Continuous scanning
	useEffect(() => {
		if (isScanning && videoRef.current) {
			setScanStatus("scanning");
			scanIntervalRef.current = setInterval(() => {
				captureAndScanImage();
			}, 500); // Scan every 500ms
		} else {
			setScanStatus("idle");
			if (scanIntervalRef.current) {
				clearInterval(scanIntervalRef.current);
				scanIntervalRef.current = null;
			}
		}

		return () => {
			if (scanIntervalRef.current) {
				clearInterval(scanIntervalRef.current);
			}
		};
	}, [isScanning, captureAndScanImage]);

	const toggleScanning = useCallback(() => {
		setIsScanning((prev) => !prev);
	}, []);

	if (eventsLoading || flagLoading)
		return <div className="max-w-md mx-auto p-4 pb-24">Loading events…</div>;

	if (eventsError)
		return (
			<div className="max-w-md mx-auto p-4 pb-24">
				<Alert variant="destructive">
					Error loading events. Please try again.
				</Alert>
			</div>
		);

	const isCheckInDisabled = !checkInFlag?.isEnabled;

	return (
		<>
			<Toaster position="bottom-right" richColors />
			<div className="container max-w-md mx-auto py-8 pb-24">
				<h1 className="text-2xl font-bold text-center mb-6">QR Code Scanner</h1>

				{isCheckInDisabled && (
					<Alert variant="destructive" className="mb-4">
						Check-in is currently disabled. Please contact an administrator.
					</Alert>
				)}

				<div className="space-y-4">
					<div>
						<Label htmlFor="event-select">Select Event</Label>
						<Select value={selectedEvent} onValueChange={handleEventChange}>
							<SelectTrigger id="event-select" className="w-full text-left">
								<SelectValue placeholder="Choose an event" />
							</SelectTrigger>
							<SelectContent>
								{eventsData?.map((evt) => (
									<SelectItem key={evt.id} value={evt.id}>
										<div className="space-y-0">
											<span>{evt.name}</span>
											<br />
											<span className="text-sm text-muted-foreground">
												{new Date(evt.startTime).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}{" "}
												-{" "}
												{new Date(evt.endTime).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Camera with overlay */}
					<div className="relative overflow-hidden rounded-lg bg-black">
						<video
							ref={videoRef}
							autoPlay
							muted
							playsInline
							className="w-full"
						/>

						{/* QR Code targeting overlay */}
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div className="relative">
								{/* Main scanning frame */}
								<div
									className={`w-48 h-48 rounded-lg transition-colors duration-300 `}
								>
									{/* Corner indicators */}
									<div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
									<div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
									<div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
									<div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>

									{/* Success indicator */}
									{scanStatus === "found" && (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
												<svg
													className="w-5 h-5 text-white"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Status indicator */}
						<div className="absolute top-4 right-4">
							<div
								className={`w-3 h-3 rounded-full ${
									scanStatus === "found"
										? "bg-green-400"
										: scanStatus === "scanning"
											? "bg-blue-400 animate-pulse"
											: "bg-gray-400"
								}`}
							></div>
						</div>
					</div>

					{/* Control buttons */}
					<div className="flex gap-2">
						<Button
							variant={isScanning ? "destructive" : "default"}
							onClick={toggleScanning}
							className="flex-1"
							disabled={isCheckInDisabled}
						>
							{isScanning ? "Stop Scanning" : "Start Scanning"}
						</Button>

						<Button
							variant="outline"
							onClick={captureAndScanImage}
							className="flex-1 bg-transparent"
							disabled={!isScanning || isCheckInDisabled}
						>
							Manual Scan
						</Button>
					</div>

					{/* Status text */}
					<div className="text-center text-sm text-muted-foreground">
						{isCheckInDisabled
							? "Check-in is currently disabled."
							: isScanning
								? "Continuously scanning for QR codes..."
								: "Scanning is paused. Click 'Start Scanning' to resume."}
					</div>
				</div>
			</div>
		</>
	);
};

export default ScanPage;
