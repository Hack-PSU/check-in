"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { useFirebase } from "@/common/context";
import { useAllEvents, useCheckInEvent } from "@/common/api/event";
import { useActiveHackathonForStatic } from "@/common/api/hackathon/hook";

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
	const { user, logout } = useFirebase();

	const [selectedEvent, setSelectedEvent] = useState<string>("");

	const {
		data: eventsData,
		isLoading: eventsLoading,
		isError: eventsError,
	} = useAllEvents();
	const { data: hackathonData } = useActiveHackathonForStatic();
	const { mutate: checkInMutate } = useCheckInEvent();

	// Start camera
	useEffect(() => {
		let stream: MediaStream | null = null;
		const startCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "environment" },
				});
				if (videoRef.current) videoRef.current.srcObject = stream;
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
					},
					onError: (err: any) => {
						console.error(err);
						toast.error(`Error checking in user: ${err.message}`);
					},
				}
			);
		},
		[user, selectedEvent, hackathonData, checkInMutate, logout, eventsData]
	);

	const captureAndScanImage = useCallback(async () => {
		if (!videoRef.current) return;
		const canvas = document.createElement("canvas");
		canvas.width = videoRef.current.videoWidth;
		canvas.height = videoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.drawImage(videoRef.current, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);
			if (code) {
				const userId = code.data.replace("HACKPSU_", "");
				handleCheckIn(userId);
			} else {
				toast.error("No QR code detected");
			}
		} else {
			toast.error("Error processing the image");
		}
	}, [handleCheckIn]);

	if (eventsLoading)
		return <div className="max-w-md mx-auto p-4">Loading events…</div>;
	if (eventsError)
		return (
			<div className="max-w-md mx-auto p-4">
				<Alert variant="destructive">
					Error loading events. Please try again.
				</Alert>
			</div>
		);

	return (
		<>
			<Toaster position="bottom-right" richColors />

			<div className="container max-w-md mx-auto py-8">
				<h1 className="text-2xl font-bold text-center mb-6">QR Code Scanner</h1>

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

					<div className="overflow-hidden rounded-lg">
						<video
							ref={videoRef}
							autoPlay
							muted
							playsInline
							className="w-full"
						/>
					</div>

					<Button
						variant="outline"
						onClick={captureAndScanImage}
						className="w-full"
					>
						Scan QR Code
					</Button>
				</div>
			</div>
		</>
	);
};

export default ScanPage;
