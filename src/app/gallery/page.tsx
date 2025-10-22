"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useGetAllPhotos, useGetPendingPhotos, useUploadPhoto, useApprovePhoto, useRejectPhoto } from "@/common/api/photos";
import { useUser } from "@/common/api/user";
import { useOrganizer } from "@/common/api/organizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toaster, toast } from "sonner";
import {
	ChevronLeft,
	ChevronRight,
	Upload,
	Camera,
	X,
	Grid,
	Play,
	Loader2,
	ImageIcon,
	CheckCircle,
	Zap,
	ZapOff,
	Sun,
	Image as ImageIconAlt,
	Maximize,
	Timer,
	Download,
	Check,
	XCircle,
	Clock,
} from "lucide-react";

const PHOTOS_PER_PAGE = 10;

type TabType = "approved" | "pending" | "rejected";

const PhotoGalleryPage: React.FC = () => {
	const [currentTab, setCurrentTab] = useState<TabType>("approved");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
		null
	);
	const [viewMode, setViewMode] = useState<"grid" | "slideshow">("grid");
	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [previewImages, setPreviewImages] = useState<
		{ file: File; preview: string }[]
	>([]);
	const [cameraPreview, setCameraPreview] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<{
		[key: string]: "pending" | "uploading" | "success" | "error";
	}>({});
	const [facingMode, setFacingMode] = useState<"user" | "environment">(
		"environment"
	);
	const [flashMode, setFlashMode] = useState<"off" | "on" | "auto">("off");
	const [zoomLevel, setZoomLevel] = useState(1);
	const [gridOverlay, setGridOverlay] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState(0);
	const [timerCountdown, setTimerCountdown] = useState<number | null>(null);
	const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
		[]
	);
	const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const { data: allPhotos, isLoading, error, refetch } = useGetAllPhotos();
	const { data: pendingPhotos, isLoading: isPendingLoading, error: pendingError, refetch: refetchPending } = useGetPendingPhotos();
	const uploadMutation = useUploadPhoto();
	const approveMutation = useApprovePhoto();
	const rejectMutation = useRejectPhoto();

	// Calculate pagination and filter photos based on current tab
	const getPhotosForTab = (): typeof allPhotos => {
		if (currentTab === "approved") {
			return allPhotos?.filter(p => !p.approvalStatus || p.approvalStatus === "approved") || [];
		} else if (currentTab === "pending") {
			return pendingPhotos?.filter(p => p.approvalStatus === "pending") || [];
		} else {
			return pendingPhotos?.filter(p => p.approvalStatus === "rejected") || [];
		}
	};

	const displayPhotos = getPhotosForTab();
	const totalPhotos = displayPhotos?.length || 0;
	const totalPages = Math.ceil(totalPhotos / PHOTOS_PER_PAGE);
	const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
	const endIndex = startIndex + PHOTOS_PER_PAGE;
	const currentPhotos = displayPhotos?.slice(startIndex, endIndex) || [];

	// Reset to page 1 when changing tabs
	useEffect(() => {
		setCurrentPage(1);
	}, [currentTab]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (selectedPhotoIndex === null) return;

			if (e.key === "ArrowLeft") {
				navigatePhoto("prev");
			} else if (e.key === "ArrowRight") {
				navigatePhoto("next");
			} else if (e.key === "Escape") {
				setSelectedPhotoIndex(null);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [selectedPhotoIndex, allPhotos]);

	// Cleanup camera on unmount
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				console.log("Cleaning up camera stream on unmount");
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
		};
	}, []);

	// Effect to assign stream to video element when both are available
	useEffect(() => {
		if (
			isCameraOpen &&
			streamRef.current &&
			videoRef.current &&
			!videoRef.current.srcObject
		) {
			videoRef.current.srcObject = streamRef.current;
		}
	}, [isCameraOpen]);

	// Lock body scroll when camera is open
	useEffect(() => {
		if (isCameraOpen) {
			document.body.style.overflow = "hidden";
			document.body.style.position = "fixed";
			document.body.style.width = "100%";
			document.body.style.height = "100%";
		} else {
			document.body.style.overflow = "";
			document.body.style.position = "";
			document.body.style.width = "";
			document.body.style.height = "";
		}

		return () => {
			document.body.style.overflow = "";
			document.body.style.position = "";
			document.body.style.width = "";
			document.body.style.height = "";
		};
	}, [isCameraOpen]);

	const navigatePhoto = (direction: "prev" | "next") => {
		if (!displayPhotos || selectedPhotoIndex === null) return;

		if (direction === "prev" && selectedPhotoIndex > 0) {
			setSelectedPhotoIndex(selectedPhotoIndex - 1);
		} else if (
			direction === "next" &&
			selectedPhotoIndex < displayPhotos.length - 1
		) {
			setSelectedPhotoIndex(selectedPhotoIndex + 1);
		}
	};

	const UserNameDisplay: React.FC<{ userId: string }> = ({ userId }) => {
		console.log(userId);
		const { data: user } = useUser(userId);
		const { data: organizer } = useOrganizer(userId);

		//determine whether it is a user or organizer
		const firstname = user?.firstName || organizer?.firstName || "";
		const lastname = user?.lastName || organizer?.lastName || "";
		
		const fullName = firstname && lastname ? `${firstname} ${lastname}` : "";
		return <>{fullName || "Unknown User"}</>;
	};

	// Download helper: try to fetch as blob then trigger download; fallback opens in new tab
	const downloadMedia = async (url: string, filename?: string) => {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error("Network response was not ok");
			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = filename || url.split("/").pop() || "download";
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch (err) {
			console.warn("download failed, falling back to opening in new tab:", err);
			window.open(url, "_blank", "noopener,noreferrer");
			toast.error("Could not download directly. Opened in a new tab.");
		}
	};

	const handleApprove = async (filename: string) => {
		try {
			await approveMutation.mutateAsync(filename);
			toast.success("Photo approved successfully!");
			refetch();
			refetchPending();
		} catch (error) {
			toast.error("Failed to approve photo");
			console.error(error);
		}
	};

	const handleReject = async (filename: string) => {
		try {
			await rejectMutation.mutateAsync(filename);
			toast.success("Photo rejected successfully!");
			refetch();
			refetchPending();
		} catch (error) {
			toast.error("Failed to reject photo");
			console.error(error);
		}
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		if (files.length === 0) return;

		const validImageFormats = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
		];
		const validVideoFormats = ["video/mp4", "video/quicktime", "video/webm"];
		const allValidFormats = [...validImageFormats, ...validVideoFormats];

		const validFiles: { file: File; preview: string }[] = [];
		let invalidCount = 0;
		let oversizedCount = 0;

		files.forEach((file) => {
			if (!allValidFormats.includes(file.type)) {
				invalidCount++;
				return;
			}

			if (file.size > 100 * 1024 * 1024) {
				oversizedCount++;
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				validFiles.push({
					file,
					preview: e.target?.result as string,
				});

				// Update state when all files are processed
				if (
					validFiles.length + invalidCount + oversizedCount ===
					files.length
				) {
					setPreviewImages(validFiles);

					if (invalidCount > 0) {
						toast.error(`${invalidCount} file(s) skipped - invalid format`);
					}
					if (oversizedCount > 0) {
						toast.error(
							`${oversizedCount} file(s) skipped - size exceeds 100MB`
						);
					}
				}
			};
			reader.readAsDataURL(file);
		});
	};

	const handleUpload = async () => {
		if (previewImages.length === 0) return;

		setUploadProgress(true);
		const newStatus: {
			[key: string]: "pending" | "uploading" | "success" | "error";
		} = {};

		// Initialize status for all files
		previewImages.forEach((item, index) => {
			newStatus[index.toString()] = "pending";
		});
		setUploadStatus(newStatus);

		let successCount = 0;
		let errorCount = 0;

		// Upload files sequentially to avoid overwhelming the server
		for (let i = 0; i < previewImages.length; i++) {
			const item = previewImages[i];

			try {
				setUploadStatus((prev) => ({ ...prev, [i.toString()]: "uploading" }));
				await uploadMutation.mutateAsync(item.file);
				setUploadStatus((prev) => ({ ...prev, [i.toString()]: "success" }));
				successCount++;
			} catch (error) {
				setUploadStatus((prev) => ({ ...prev, [i.toString()]: "error" }));
				errorCount++;
				console.error(`Upload failed for file ${i}:`, error);
			}
		}

		// Show final result
		if (successCount > 0) {
			toast.success(`${successCount} file(s) uploaded successfully!`);
		}
		if (errorCount > 0) {
			toast.error(`${errorCount} file(s) failed to upload`);
		}

		// Clean up
		setPreviewImages([]);
		setUploadStatus({});
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		refetch();
		setUploadProgress(false);
	};

	// Get available cameras on mount
	useEffect(() => {
		const getCameras = async () => {
			try {
				const devices = await navigator.mediaDevices.enumerateDevices();
				const cameras = devices.filter(
					(device) => device.kind === "videoinput"
				);
				setAvailableCameras(cameras);
				if (cameras.length > 0 && !selectedCameraId) {
					setSelectedCameraId(cameras[0].deviceId);
				}
			} catch (error) {
				console.error("Error getting cameras:", error);
			}
		};
		getCameras();
	}, []);

	const startCamera = async () => {
		try {
			// Stop any existing streams first
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}

			// Get available cameras
			const devices = await navigator.mediaDevices.enumerateDevices();
			const cameras = devices.filter((device) => device.kind === "videoinput");
			setAvailableCameras(cameras);

			if (cameras.length === 0) {
				toast.error("No cameras found on this device");
				return;
			}

			const constraints: MediaStreamConstraints = {
				video: selectedCameraId
					? {
							deviceId: { exact: selectedCameraId },
							width: { ideal: 1920 },
							height: { ideal: 1080 },
						}
					: {
							facingMode,
							width: { ideal: 1920 },
							height: { ideal: 1080 },
						},
			};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);

			// Set camera open first to ensure the video element is rendered
			setIsCameraOpen(true);

			// Wait a bit for React to render the video element
			await new Promise((resolve) => setTimeout(resolve, 100));

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				streamRef.current = stream;

				// Apply zoom if supported
				const [track] = stream.getVideoTracks();
				const capabilities = track.getCapabilities
					? track.getCapabilities()
					: ({} as any);
				if (capabilities.zoom) {
					track.applyConstraints({
						advanced: [{ zoom: zoomLevel } as any],
					});
				}
			} else {
				// Store the stream for later assignment
				streamRef.current = stream;
			}
		} catch (error) {
			if (error instanceof DOMException) {
				switch (error.name) {
					case "NotAllowedError":
						toast.error(
							"Camera permission denied. Please allow camera access."
						);
						break;
					case "NotFoundError":
						toast.error("No camera found on this device.");
						break;
					case "NotReadableError":
						toast.error("Camera is already in use by another application.");
						break;
					case "OverconstrainedError":
						toast.error("Camera constraints could not be satisfied.");
						break;
					default:
						toast.error(`Camera error: ${error.message}`);
				}
			} else {
				toast.error("Unable to access camera");
			}
		}
	};

	const handleCameraSelect = async (cameraId: string) => {
		if (cameraId === selectedCameraId) return;

		// Stop current stream
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

		// Find selected camera
		const selectedCamera = availableCameras.find(
			(cam) => cam.deviceId === cameraId
		);

		if (selectedCamera) {
			setSelectedCameraId(cameraId);

			// Update facing mode based on camera label (heuristic)
			if (
				selectedCamera.label.toLowerCase().includes("front") ||
				selectedCamera.label.toLowerCase().includes("user")
			) {
				setFacingMode("user");
			} else {
				setFacingMode("environment");
			}

			// Restart camera with new settings
			await startCamera();
		}
	};

	const getCameraDisplayName = (camera: MediaDeviceInfo) => {
		if (camera.label) {
			// Clean up the camera label for display
			let name = camera.label;
			// Remove common prefixes and technical details
			name = name.replace(/^.*camera|camera.*$/i, "").trim();
			if (
				name.toLowerCase().includes("front") ||
				name.toLowerCase().includes("user")
			) {
				return "Front Camera";
			} else if (
				name.toLowerCase().includes("back") ||
				name.toLowerCase().includes("environment")
			) {
				return "Back Camera";
			}
			return name || `Camera ${availableCameras.indexOf(camera) + 1}`;
		}
		return `Camera ${availableCameras.indexOf(camera) + 1}`;
	};

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		setIsCameraOpen(false);
		setCameraPreview(null);
	};

	const capturePhoto = () => {
		if (timerSeconds > 0) {
			// Start countdown
			let countdown = timerSeconds;
			setTimerCountdown(countdown);

			const interval = setInterval(() => {
				countdown--;
				setTimerCountdown(countdown);

				if (countdown === 0) {
					clearInterval(interval);
					setTimerCountdown(null);
					performCapture();
				}
			}, 1000);
		} else {
			performCapture();
		}
	};

	const performCapture = async () => {
		if (videoRef.current && canvasRef.current) {
			// Use actual device flash/torch if available
			if (flashMode === "on" || (flashMode === "auto" && shouldUseFlash())) {
				await enableFlash();
			}

			// Visual flash effect as fallback
			const flashDiv = document.createElement("div");
			flashDiv.className = "fixed inset-0 bg-white z-[60] pointer-events-none";
			flashDiv.style.opacity = "0.8";
			document.body.appendChild(flashDiv);

			// Capture after a brief moment to allow flash to activate
			setTimeout(async () => {
				const canvas = canvasRef.current;
				const video = videoRef.current;

				if (canvas && video) {
					const context = canvas.getContext("2d");
					if (context) {
						canvas.width = video.videoWidth;
						canvas.height = video.videoHeight;
						context.drawImage(video, 0, 0);
						const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
						setCameraPreview(dataUrl);
					}
				}

				// Disable flash and remove visual effect
				if (flashMode === "on" || (flashMode === "auto" && shouldUseFlash())) {
					await disableFlash();
				}
				flashDiv.remove();
			}, 100);
		}
	};

	const shouldUseFlash = () => {
		// Simple auto-flash logic - could be enhanced with ambient light detection
		return false; // For now, only use flash when explicitly on
	};

	const enableFlash = async () => {
		try {
			if (streamRef.current) {
				const [track] = streamRef.current.getVideoTracks();
				const capabilities = track.getCapabilities
					? track.getCapabilities()
					: {};

				// Check if torch/flash is supported
				if ("torch" in capabilities && capabilities.torch) {
					await track.applyConstraints({
						advanced: [{ torch: true } as any],
					});
				}
			}
		} catch (error) {
			console.warn("Flash not supported or failed to enable:", error);
		}
	};

	const disableFlash = async () => {
		try {
			if (streamRef.current) {
				const [track] = streamRef.current.getVideoTracks();
				const capabilities = track.getCapabilities
					? track.getCapabilities()
					: {};

				// Check if torch/flash is supported
				if ("torch" in capabilities && capabilities.torch) {
					await track.applyConstraints({
						advanced: [{ torch: false } as any],
					});
				}
			}
		} catch (error) {
			console.warn("Failed to disable flash:", error);
		}
	};

	const uploadCapturedPhoto = async () => {
		if (!cameraPreview) return;

		setUploadProgress(true);
		try {
			const response = await fetch(cameraPreview);
			const blob = await response.blob();
			const file = new File([blob], `photo_${Date.now()}.jpg`, {
				type: "image/jpeg",
			});

			await uploadMutation.mutateAsync(file);
			toast.success("Photo uploaded successfully!");
			stopCamera();
			refetch();
		} catch (error) {
			toast.error("Failed to upload photo");
			console.error(error);
		} finally {
			setUploadProgress(false);
		}
	};

	const isVideo = (url: string) => {
		return /\.(mp4|mov|avi|wmv|flv|mkv|webm|m4v|mpg|mpeg|3gp)$/i.test(url);
	};

	// Lazy Image Component
	const LazyImage: React.FC<{
		src: string;
		alt: string;
		className?: string;
		onClick?: () => void;
	}> = ({ src, alt, className, onClick }) => {
		const [isLoaded, setIsLoaded] = useState(false);
		const [isInView, setIsInView] = useState(false);
		const imgRef = useRef<HTMLImageElement>(null);

		useEffect(() => {
			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) {
						setIsInView(true);
						observer.disconnect();
					}
				},
				{ threshold: 0.1 }
			);

			if (imgRef.current) {
				observer.observe(imgRef.current);
			}

			return () => observer.disconnect();
		}, []);

		return (
			<div ref={imgRef} className={className} onClick={onClick}>
				{isInView && (
					<>
						{!isLoaded && (
							<div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
								<ImageIcon className="h-8 w-8 text-gray-400" />
							</div>
						)}
						<img
							src={src}
							alt={alt}
							className={`w-full h-full object-cover ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
							onLoad={() => setIsLoaded(true)}
							loading="lazy"
						/>
					</>
				)}
				{!isInView && (
					<div className="w-full h-full bg-gray-200 flex items-center justify-center">
						<ImageIcon className="h-8 w-8 text-gray-400" />
					</div>
				)}
			</div>
		);
	};

	if (isLoading || isPendingLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (error || pendingError) {
		return (
			<div className="container mx-auto p-4">
				<Alert variant="destructive">
					<AlertDescription>Failed to load photos</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 overflow-x-hidden">
			<Toaster />

			{/* Header - Hidden when camera is open */}
			{!isCameraOpen && (
				<div className="sticky top-0 z-40 bg-white border-b overflow-x-hidden">
					<div className="container mx-auto px-4 py-3 max-w-full">
						<div className="flex justify-between items-center mb-4">
							<h1 className="text-xl md:text-2xl font-bold">Gallery</h1>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										setViewMode(viewMode === "grid" ? "slideshow" : "grid")
									}
									className="hidden sm:flex"
								>
									<Grid className="h-4 w-4" />
								</Button>
								<Button size="sm" onClick={() => fileInputRef.current?.click()}>
									<Upload className="h-4 w-4 md:mr-2" />
									<span className="hidden md:inline">Upload</span>
								</Button>
								<Button size="sm" onClick={startCamera}>
									<Camera className="h-4 w-4 md:mr-2" />
									<span className="hidden md:inline">Camera</span>
								</Button>
							</div>
						</div>

						{/* Tabs */}
						<div className="flex gap-1 border-b -mb-3 overflow-x-auto">
							<button
								onClick={() => setCurrentTab("approved")}
								className={`px-4 py-2 font-medium text-sm transition-colors relative ${
									currentTab === "approved"
										? "text-blue-600 border-b-2 border-blue-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4" />
									<span>Approved</span>
									{allPhotos && (
										<span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
											{allPhotos.filter(p => !p.approvalStatus || p.approvalStatus === "approved").length}
										</span>
									)}
								</div>
							</button>
							<button
								onClick={() => setCurrentTab("pending")}
								className={`px-4 py-2 font-medium text-sm transition-colors relative ${
									currentTab === "pending"
										? "text-blue-600 border-b-2 border-blue-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									<span>Pending</span>
									{pendingPhotos && (
										<span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
											{pendingPhotos.filter(p => p.approvalStatus === "pending").length}
										</span>
									)}
								</div>
							</button>
							<button
								onClick={() => setCurrentTab("rejected")}
								className={`px-4 py-2 font-medium text-sm transition-colors relative ${
									currentTab === "rejected"
										? "text-blue-600 border-b-2 border-blue-600"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								<div className="flex items-center gap-2">
									<XCircle className="h-4 w-4" />
									<span>Rejected</span>
									{pendingPhotos && (
										<span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
											{pendingPhotos.filter(p => p.approvalStatus === "rejected").length}
										</span>
									)}
								</div>
							</button>
						</div>
					</div>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*,video/*"
				multiple
				onChange={handleFileSelect}
				className="hidden"
			/>

			{/* Multiple Upload Preview Modal */}
			{previewImages.length > 0 && !isCameraOpen && (
				<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
						<div className="p-4 border-b flex justify-between items-center">
							<h2 className="text-lg font-semibold">
								Upload {previewImages.length} file
								{previewImages.length > 1 ? "s" : ""}
							</h2>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setPreviewImages([]);
									setUploadStatus({});
									if (fileInputRef.current) {
										fileInputRef.current.value = "";
									}
								}}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<div className="p-4">
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
								{previewImages.map((item, index) => (
									<div key={index} className="relative">
										{item.file.type.startsWith("video/") ? (
											<video
												src={item.preview}
												className="w-full aspect-square object-cover rounded-lg"
											/>
										) : (
											<img
												src={item.preview}
												alt={`Preview ${index + 1}`}
												className="w-full aspect-square object-cover rounded-lg"
											/>
										)}

										{/* Upload status indicator */}
										<div className="absolute top-2 right-2">
											{uploadStatus[index.toString()] === "uploading" && (
												<div className="bg-blue-500 text-white rounded-full p-1">
													<Loader2 className="h-4 w-4 animate-spin" />
												</div>
											)}
											{uploadStatus[index.toString()] === "success" && (
												<div className="bg-green-500 text-white rounded-full p-1">
													<CheckCircle className="h-4 w-4" />
												</div>
											)}
											{uploadStatus[index.toString()] === "error" && (
												<div className="bg-red-500 text-white rounded-full p-1">
													<X className="h-4 w-4" />
												</div>
											)}
										</div>

										<div className="absolute bottom-2 left-2 right-2">
											<div className="bg-black/60 text-white text-xs p-1 rounded truncate">
												{item.file.name}
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="flex gap-2">
								<Button
									className="flex-1"
									onClick={handleUpload}
									disabled={uploadProgress}
								>
									{uploadProgress ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<Upload className="h-4 w-4 mr-2" />
									)}
									Upload All
								</Button>
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => {
										setPreviewImages([]);
										setUploadStatus({});
										if (fileInputRef.current) {
											fileInputRef.current.value = "";
										}
									}}
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Camera Modal - Native camera UI feel */}
			{isCameraOpen && (
				<div
					className="fixed inset-0 bg-black z-[100] flex flex-col"
					style={{ top: 0, left: 0, right: 0, bottom: 0, position: "fixed" }}
				>
					{/* Top controls bar */}
					<div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 pt-safe">
						<div className="flex justify-between items-start pt-4 sm:pt-2">
							{/* Left controls */}
							<div className="flex gap-3">
								<button
									onClick={stopCamera}
									className="p-2 rounded-full bg-black/30 backdrop-blur text-white hover:bg-black/50 transition"
								>
									<X className="h-5 w-5" />
								</button>

								{/* Flash control */}
								<button
									onClick={() =>
										setFlashMode(
											flashMode === "off"
												? "on"
												: flashMode === "on"
													? "auto"
													: "off"
										)
									}
									className="p-2 rounded-full bg-black/30 backdrop-blur text-white hover:bg-black/50 transition"
								>
									{flashMode === "off" ? (
										<ZapOff className="h-5 w-5" />
									) : flashMode === "on" ? (
										<Zap className="h-5 w-5 text-yellow-400" />
									) : (
										<Sun className="h-5 w-5 text-yellow-200" />
									)}
								</button>

								{/* Timer control */}
								<button
									onClick={() =>
										setTimerSeconds(
											timerSeconds === 0 ? 3 : timerSeconds === 3 ? 10 : 0
										)
									}
									className="p-2 rounded-full bg-black/30 backdrop-blur text-white hover:bg-black/50 transition flex items-center"
								>
									<Timer className="h-5 w-5" />
									{timerSeconds > 0 && (
										<span className="ml-1 text-xs">{timerSeconds}s</span>
									)}
								</button>
							</div>

							{/* Right controls */}
							<div className="flex gap-3">
								{/* Grid overlay toggle */}
								<button
									onClick={() => setGridOverlay(!gridOverlay)}
									className={`p-2 rounded-full bg-black/30 backdrop-blur text-white hover:bg-black/50 transition ${
										gridOverlay ? "bg-white/20" : ""
									}`}
								>
									<Grid className="h-5 w-5" />
								</button>

								{/* Camera selector */}
								{availableCameras.length > 1 && (
									<button
										onClick={() => {
											const currentIndex = availableCameras.findIndex(
												(cam) => cam.deviceId === selectedCameraId
											);
											const nextIndex =
												(currentIndex + 1) % availableCameras.length;
											const nextCamera = availableCameras[nextIndex];
											handleCameraSelect(nextCamera.deviceId);
										}}
										className="px-3 py-2 rounded-full bg-black/30 backdrop-blur text-white hover:bg-black/50 transition text-xs"
									>
										{selectedCameraId
											? getCameraDisplayName(
													availableCameras.find(
														(cam) => cam.deviceId === selectedCameraId
													)!
												)
											: "Camera"}
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Camera viewport */}
					<div className="flex-1 relative">
						{!cameraPreview ? (
							<div className="w-full h-full relative">
								{/* Live camera feed */}
								<video
									ref={videoRef}
									autoPlay
									playsInline
									muted
									className="w-full h-full object-cover"
								/>

								{/* Timer countdown overlay */}
								{timerCountdown !== null && (
									<div className="absolute inset-0 flex items-center justify-center bg-black/30">
										<div className="text-white text-8xl font-bold animate-ping">
											{timerCountdown || "📸"}
										</div>
									</div>
								)}

								{/* Grid overlay */}
								{gridOverlay && !timerCountdown && (
									<div className="absolute inset-0 pointer-events-none">
										<div className="w-full h-full grid grid-cols-3 grid-rows-3">
											{[...Array(9)].map((_, i) => (
												<div key={i} className="border border-white/30" />
											))}
										</div>
									</div>
								)}

								{/* Focus point indicator */}
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div className="w-16 h-16 border-2 border-white/50 rounded-lg animate-pulse" />
								</div>

								{/* Zoom slider */}
								{videoRef.current && (
									<div className="absolute bottom-32 sm:bottom-28 left-1/2 transform -translate-x-1/2">
										<input
											type="range"
											min="1"
											max="5"
											step="0.1"
											value={zoomLevel}
											onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
											className="w-32 opacity-70"
										/>
									</div>
								)}
							</div>
						) : (
							<img
								src={cameraPreview}
								alt="Captured"
								className="w-full h-full object-contain"
							/>
						)}
						<canvas ref={canvasRef} className="hidden" />
					</div>

					{/* Bottom controls bar with safe area padding */}
					<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pb-safe">
						{!cameraPreview ? (
							<div className="flex items-center justify-between max-w-md mx-auto pb-8 sm:pb-6">
								{/* Gallery preview */}
								<button className="w-12 h-12 rounded-lg bg-black/30 backdrop-blur overflow-hidden border border-white/30">
									{allPhotos && allPhotos.length > 0 ? (
										<img
											src={allPhotos[0].url}
											alt="Last photo"
											className="w-full h-full object-cover"
										/>
									) : (
										<ImageIconAlt className="w-6 h-6 text-white/50 m-auto mt-3" />
									)}
								</button>

								{/* Capture button */}
								<button
									onClick={capturePhoto}
									disabled={timerCountdown !== null}
									className="relative group"
								>
									<div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition">
										<div className="w-16 h-16 rounded-full bg-white border-4 border-black/20" />
									</div>
									{timerCountdown === null && (
										<div className="absolute inset-0 rounded-full border-4 border-white/50 animate-pulse" />
									)}
								</button>

								{/* Settings or mode selector */}
								<button className="w-12 h-12 rounded-lg bg-black/30 backdrop-blur flex items-center justify-center border border-white/30">
									<Maximize className="w-6 h-6 text-white/70" />
								</button>
							</div>
						) : (
							<div className="flex items-center justify-center gap-4 pb-8 sm:pb-6">
								<Button
									size="lg"
									variant="ghost"
									onClick={() => {
										setCameraPreview(null);
										startCamera();
									}}
									className="text-white hover:bg-white/10"
								>
									<X className="h-5 w-5 mr-2" />
									Retake
								</Button>
								<Button
									size="lg"
									onClick={uploadCapturedPhoto}
									disabled={uploadProgress}
									className="bg-white text-black hover:bg-gray-100"
								>
									{uploadProgress ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<CheckCircle className="h-4 w-4 mr-2" />
									)}
									Save
								</Button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Photo Viewer Modal */}
			{selectedPhotoIndex !== null && displayPhotos && (
			<div className="fixed inset-0 bg-black z-50 flex flex-col">
				{/* Top bar */}
				<div className="flex justify-between items-center p-4 text-white">
				<span className="text-sm">
					{selectedPhotoIndex + 1} / {displayPhotos.length}
				</span>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setSelectedPhotoIndex(null)}
					className="text-white hover:bg-white/20"
				>
					<X className="h-5 w-5" />
				</Button>
				</div>

				{/* Centered image/video viewer */}
				<div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
				{isVideo(displayPhotos[selectedPhotoIndex].url) ? (
					<video
					src={displayPhotos[selectedPhotoIndex].url}
					controls
					className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-lg"
					/>
				) : (
					<img
					src={displayPhotos[selectedPhotoIndex].url}
					alt={displayPhotos[selectedPhotoIndex].name}
					className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-lg"
					/>
				)}

				{/* Download button inside full-screen viewer */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						downloadMedia(
							displayPhotos[selectedPhotoIndex].url,
							displayPhotos[selectedPhotoIndex].name
						);
					}}
					aria-label={`Download ${displayPhotos[selectedPhotoIndex].name}`}
					className="absolute bottom-6 right-6 bg-black/40 text-white p-3 rounded-lg hover:bg-black/60 backdrop-blur z-50"
				>
					<Download className="h-5 w-5" />
				</button>

				{/* Navigation buttons */}
				<Button
					variant="ghost"
					size="icon"
					className="absolute left-4 text-white hover:bg-white/20"
					onClick={() => navigatePhoto("prev")}
					disabled={selectedPhotoIndex === 0}
				>
					<ChevronLeft className="h-6 w-6" />
				</Button>

				<Button
					variant="ghost"
					size="icon"
					className="absolute right-4 text-white hover:bg-white/20"
					onClick={() => navigatePhoto("next")}
					disabled={selectedPhotoIndex === displayPhotos.length - 1}
				>
					<ChevronRight className="h-6 w-6" />
				</Button>
				</div>

				{/* Bottom info bar with admin controls */}
				<div className="p-4 text-white text-center space-y-3">
				<div>
					<p className="text-sm">{displayPhotos[selectedPhotoIndex].name}</p>
					<p className="text-xs opacity-75">
						{new Date(displayPhotos[selectedPhotoIndex].createdAt).toLocaleString()}
					</p>
					{displayPhotos[selectedPhotoIndex].uploadedBy && (
						<p className="text-xs opacity-75">
							Uploaded by: {displayPhotos[selectedPhotoIndex].uploadedBy}
						</p>
					)}
				</div>

				{/* Admin controls in viewer */}
				{(currentTab === "pending" || currentTab === "rejected" || currentTab === "approved") && (
					<div className="flex gap-2 justify-center max-w-md mx-auto">
						{currentTab === "pending" && (
							<>
								<Button
									onClick={() => {
										handleApprove(displayPhotos[selectedPhotoIndex].name);
										setSelectedPhotoIndex(null);
									}}
									className="bg-green-600 hover:bg-green-700"
									disabled={approveMutation.isPending}
								>
									<Check className="h-4 w-4 mr-2" />
									Approve
								</Button>
								<Button
									onClick={() => {
										handleReject(displayPhotos[selectedPhotoIndex].name);
										setSelectedPhotoIndex(null);
									}}
									className="bg-red-600 hover:bg-red-700"
									disabled={rejectMutation.isPending}
								>
									<XCircle className="h-4 w-4 mr-2" />
									Reject
								</Button>
							</>
						)}
						{currentTab === "rejected" && (
							<Button
								onClick={() => {
									handleApprove(displayPhotos[selectedPhotoIndex].name);
									setSelectedPhotoIndex(null);
								}}
								className="bg-green-600 hover:bg-green-700"
								disabled={approveMutation.isPending}
							>
								<Check className="h-4 w-4 mr-2" />
								Approve
							</Button>
						)}
						{currentTab === "approved" && (
							<Button
								onClick={() => {
									handleReject(displayPhotos[selectedPhotoIndex].name);
									setSelectedPhotoIndex(null);
								}}
								className="bg-red-600 hover:bg-red-700"
								disabled={rejectMutation.isPending}
							>
								<XCircle className="h-4 w-4 mr-2" />
								Reject
							</Button>
						)}
					</div>
				)}
				</div>
			</div>
			)}

			{/* Main Content */}
			<div className="container mx-auto px-4 py-6 max-w-full overflow-x-hidden">
				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mb-6 flex justify-center items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setCurrentPage(currentPage - 1)}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						<div className="flex gap-1">
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								let pageNum;
								if (totalPages <= 5) {
									pageNum = i + 1;
								} else if (currentPage <= 3) {
									pageNum = i + 1;
								} else if (currentPage >= totalPages - 2) {
									pageNum = totalPages - 4 + i;
								} else {
									pageNum = currentPage - 2 + i;
								}

								return (
									<Button
										key={pageNum}
										size="sm"
										variant={currentPage === pageNum ? "default" : "outline"}
										onClick={() => setCurrentPage(pageNum)}
										className="w-8"
									>
										{pageNum}
									</Button>
								);
							})}
						</div>

						<Button
							size="sm"
							variant="outline"
							onClick={() => setCurrentPage(currentPage + 1)}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Slideshow Mode */}
				{viewMode === "slideshow" && currentPhotos.length > 0 && (
					<Card className="mb-6">
						<CardContent className="p-4">
							<div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center relative">
								{isVideo(currentPhotos[0].url) ? (
									<>
										<video
											src={currentPhotos[0].url}
											controls
											className="w-full h-full object-contain rounded-lg"
											preload="metadata"
										/>
										<button
											onClick={(e) => {
												e.stopPropagation();
												downloadMedia(currentPhotos[0].url, currentPhotos[0].name);
											}}
											aria-label={`Download ${currentPhotos[0].name}`}
											className="absolute bottom-2 right-2 bg-black/40 text-white p-2 rounded-lg hover:bg-black/60 backdrop-blur z-10"
										>
											<Download className="h-4 w-4" />
										</button>
									</>
								) : (
									<>
										<LazyImage
											src={currentPhotos[0].url}
											alt={currentPhotos[0].name}
											className="w-full h-full object-contain rounded-lg cursor-pointer"
											onClick={() => setSelectedPhotoIndex(startIndex)}
										/>
										<button
											onClick={(e) => {
												e.stopPropagation();
												downloadMedia(currentPhotos[0].url, currentPhotos[0].name);
											}}
											aria-label={`Download ${currentPhotos[0].name}`}
											className="absolute bottom-2 right-2 bg-black/40 text-white p-2 rounded-lg hover:bg-black/60 backdrop-blur z-10"
										>
											<Download className="h-4 w-4" />
										</button>
									</>
								)}
							</div>
							<div className="mt-4 text-center space-y-2">
								<p className="font-medium">{currentPhotos[0].name}</p>
								<p className="text-sm text-gray-500">
									{new Date(currentPhotos[0].createdAt).toLocaleString()}
								</p>

								{/* Admin controls in slideshow */}
								{(currentTab === "pending" || currentTab === "rejected" || currentTab === "approved") && (
									<div className="flex gap-2 justify-center max-w-md mx-auto pt-2">
										{currentTab === "pending" && (
											<>
												<Button
													onClick={() => handleApprove(currentPhotos[0].name)}
													className="bg-green-600 hover:bg-green-700"
													disabled={approveMutation.isPending}
												>
													<Check className="h-4 w-4 mr-2" />
													Approve
												</Button>
												<Button
													onClick={() => handleReject(currentPhotos[0].name)}
													className="bg-red-600 hover:bg-red-700"
													disabled={rejectMutation.isPending}
												>
													<XCircle className="h-4 w-4 mr-2" />
													Reject
												</Button>
											</>
										)}
										{currentTab === "rejected" && (
											<Button
												onClick={() => handleApprove(currentPhotos[0].name)}
												className="bg-green-600 hover:bg-green-700"
												disabled={approveMutation.isPending}
											>
												<Check className="h-4 w-4 mr-2" />
												Approve
											</Button>
										)}
										{currentTab === "approved" && (
											<Button
												onClick={() => handleReject(currentPhotos[0].name)}
												className="bg-red-600 hover:bg-red-700"
												disabled={rejectMutation.isPending}
											>
												<XCircle className="h-4 w-4 mr-2" />
												Reject
											</Button>
										)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Grid View */}
				{currentPhotos.length > 0 ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
						{currentPhotos.map((photo, index) => (
							<div
								key={`${photo.url}-${index}`}
								className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
							>
								<div
									className="w-full h-full cursor-pointer"
									onClick={() => setSelectedPhotoIndex(startIndex + index)}
								>
									{isVideo(photo.url) ? (
										<div className="relative w-full h-full bg-gray-100">
											<video
												src={photo.url}
												className="w-full h-full object-cover"
												preload="none"
												poster=""
											/>
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="bg-black/50 rounded-full p-3">
													<Play className="h-6 w-6 text-white" />
												</div>
											</div>
										</div>
									) : (
										<LazyImage
											src={photo.url}
											alt={photo.name}
											className="w-full h-full"
										/>
									)}
								</div>

								{/* User name label - shows on hover */}
								<div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
									<div className="text-white text-xs font-medium">
										{photo.uploadedBy ? <UserNameDisplay userId={photo.uploadedBy} /> : "Unknown User"}
									</div>
								</div>

								{/* Admin controls for approved photos */}
								{currentTab === "approved" && (
									<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
										<div className="flex gap-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													downloadMedia(photo.url, photo.name);
												}}
												aria-label={`Download ${photo.name}`}
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg backdrop-blur text-xs flex items-center justify-center gap-1"
											>
												<Download className="h-3 w-3" />
												Download
											</button>
											<Button
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleReject(photo.name);
												}}
												className="flex-1 bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
												disabled={rejectMutation.isPending}
											>
												<XCircle className="h-3 w-3 mr-1" />
												Reject
											</Button>
										</div>
									</div>
								)}

								{/* Admin controls for pending and rejected photos */}
								{(currentTab === "pending" || currentTab === "rejected") && (
									<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
										<div className="flex gap-2">
											{currentTab === "pending" && (
												<>
													<Button
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															handleApprove(photo.name);
														}}
														className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
														disabled={approveMutation.isPending}
													>
														<Check className="h-3 w-3 mr-1" />
														Approve
													</Button>
													<Button
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															handleReject(photo.name);
														}}
														className="flex-1 bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
														disabled={rejectMutation.isPending}
													>
														<X className="h-3 w-3 mr-1" />
														Reject
													</Button>
												</>
											)}
											{currentTab === "rejected" && (
												<Button
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														handleApprove(photo.name);
													}}
													className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
													disabled={approveMutation.isPending}
												>
													<Check className="h-3 w-3 mr-1" />
													Approve
												</Button>
											)}
										</div>
									</div>
								)}

								{/* Status indicator badge */}
								{photo.approvalStatus && (
									<div className="absolute top-2 right-2">
										{photo.approvalStatus === "pending" && (
											<div className="bg-yellow-500 text-white rounded-full p-1 shadow-md">
												<Clock className="h-3 w-3" />
											</div>
										)}
										{photo.approvalStatus === "approved" && (
											<div className="bg-green-500 text-white rounded-full p-1 shadow-md">
												<CheckCircle className="h-3 w-3" />
											</div>
										)}
										{photo.approvalStatus === "rejected" && (
											<div className="bg-red-500 text-white rounded-full p-1 shadow-md">
												<XCircle className="h-3 w-3" />
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<Card className="mt-8">
						<CardContent className="py-12 text-center">
							<ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">No photos yet</h3>
							<p className="text-gray-500 mb-4">
								Upload your first photo or video to get started
							</p>
							<div className="flex justify-center gap-2">
								<Button onClick={() => fileInputRef.current?.click()}>
									<Upload className="h-4 w-4 mr-2" />
									Upload
								</Button>
								<Button variant="outline" onClick={startCamera}>
									<Camera className="h-4 w-4 mr-2" />
									Camera
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};

export default PhotoGalleryPage;
