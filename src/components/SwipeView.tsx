"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Check, Globe, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Photo {
	name: string;
	url: string;
	createdAt: string;
	approvalStatus?: "pending" | "approved" | "rejected" | "unknown";
	uploadedBy?: string;
	derivatives?: {
		[key: string]: string;
	};
}

interface SwipeViewProps {
	photos: Photo[];
	onApprove: (filename: string) => Promise<void>;
	onReject: (filename: string) => Promise<void>;
	onMakePublic: (photoUrl: string, filename: string) => Promise<void>;
	onExit: () => void;
}

const SWIPE_THRESHOLD = 150;
const SWIPE_UP_THRESHOLD = 100;

export const SwipeView: React.FC<SwipeViewProps> = ({
	photos,
	onApprove,
	onReject,
	onMakePublic,
	onExit,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	// Transform values for rotation and opacity based on drag
	const rotate = useTransform(x, [-200, 200], [-25, 25]);
	const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

	// Opacity for action indicators
	const approveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
	const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
	const publicOpacity = useTransform(y, [-SWIPE_UP_THRESHOLD, 0], [1, 0]);

	const currentPhoto = photos[currentIndex];

	if (!currentPhoto) {
		return (
			<div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
				<div className="text-center space-y-4">
					<h2 className="text-2xl font-bold">No more photos to review!</h2>
					<Button onClick={onExit}>Back to Gallery</Button>
				</div>
			</div>
		);
	}

	const handleDragEnd = async (_event: any, info: PanInfo) => {
		const offsetX = info.offset.x;
		const offsetY = info.offset.y;
		const velocityX = info.velocity.x;
		const velocityY = info.velocity.y;

		// Check swipe up first (make public)
		if (offsetY < -SWIPE_UP_THRESHOLD || velocityY < -500) {
			setExitDirection("up");
			await onMakePublic(currentPhoto.url, currentPhoto.name);
			setTimeout(() => {
				setCurrentIndex((prev) => prev + 1);
				setExitDirection(null);
				x.set(0);
				y.set(0);
			}, 300);
		}
		// Check swipe right (approve)
		else if (offsetX > SWIPE_THRESHOLD || velocityX > 500) {
			setExitDirection("right");
			await onApprove(currentPhoto.name);
			setTimeout(() => {
				setCurrentIndex((prev) => prev + 1);
				setExitDirection(null);
				x.set(0);
				y.set(0);
			}, 300);
		}
		// Check swipe left (reject)
		else if (offsetX < -SWIPE_THRESHOLD || velocityX < -500) {
			setExitDirection("left");
			await onReject(currentPhoto.name);
			setTimeout(() => {
				setCurrentIndex((prev) => prev + 1);
				setExitDirection(null);
				x.set(0);
				y.set(0);
			}, 300);
		}
		// Snap back if threshold not reached
		else {
			x.set(0);
			y.set(0);
		}
	};

	const handleButtonAction = async (action: "approve" | "reject" | "public") => {
		if (action === "approve") {
			setExitDirection("right");
			await onApprove(currentPhoto.name);
		} else if (action === "reject") {
			setExitDirection("left");
			await onReject(currentPhoto.name);
		} else if (action === "public") {
			setExitDirection("up");
			await onMakePublic(currentPhoto.url, currentPhoto.name);
		}

		setTimeout(() => {
			setCurrentIndex((prev) => prev + 1);
			setExitDirection(null);
			x.set(0);
			y.set(0);
		}, 300);
	};

	return (
		<div className="fixed inset-0 z-50 bg-background overflow-hidden">
			{/* Header */}
			<div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm">
				<div className="flex items-center justify-between">
					<Button variant="ghost" size="icon" onClick={onExit}>
						<ChevronLeft className="h-6 w-6" />
					</Button>
					<div className="text-sm font-medium">
						{currentIndex + 1} / {photos.length}
					</div>
					<div className="w-10" /> {/* Spacer for centering */}
				</div>
			</div>

			{/* Swipe Instructions */}
			<div className="absolute top-20 left-0 right-0 z-10 text-center text-sm text-muted-foreground">
				<p>Swipe right to approve • Swipe left to reject • Swipe up for public</p>
			</div>

			{/* Card Stack */}
			<div className="absolute inset-0 flex items-center justify-center p-4">
				{/* Show next card underneath */}
				{photos[currentIndex + 1] && (
					<div className="absolute w-full max-w-md aspect-[3/4] rounded-2xl bg-card shadow-xl scale-95 opacity-50">
						<div className="relative w-full h-full">
							<Image
								src={photos[currentIndex + 1].url}
								alt="Next photo"
								fill
								className="object-cover rounded-2xl"
								unoptimized
							/>
						</div>
					</div>
				)}

				{/* Current card */}
				<motion.div
					className="relative w-full max-w-md aspect-[3/4] cursor-grab active:cursor-grabbing"
					style={{
						x,
						y,
						rotate,
						opacity,
					}}
					drag
					dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
					dragElastic={0.7}
					onDragEnd={handleDragEnd}
					animate={
						exitDirection
							? {
									x: exitDirection === "right" ? 500 : exitDirection === "left" ? -500 : 0,
									y: exitDirection === "up" ? -500 : 0,
									opacity: 0,
							  }
							: {}
					}
					transition={{ duration: 0.3 }}
				>
					<div className="relative w-full h-full rounded-2xl bg-card shadow-2xl overflow-hidden">
						<Image
							src={currentPhoto.url}
							alt={currentPhoto.name}
							fill
							className="object-cover"
							unoptimized
						/>

						{/* Approve Indicator */}
						<motion.div
							style={{ opacity: approveOpacity }}
							className="absolute top-8 right-8 px-6 py-3 bg-green-500 text-white font-bold text-2xl rounded-lg rotate-12 border-4 border-green-400"
						>
							APPROVE
						</motion.div>

						{/* Reject Indicator */}
						<motion.div
							style={{ opacity: rejectOpacity }}
							className="absolute top-8 left-8 px-6 py-3 bg-red-500 text-white font-bold text-2xl rounded-lg -rotate-12 border-4 border-red-400"
						>
							REJECT
						</motion.div>

						{/* Make Public Indicator */}
						<motion.div
							style={{ opacity: publicOpacity }}
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-blue-500 text-white font-bold text-2xl rounded-lg border-4 border-blue-400"
						>
							PUBLIC
						</motion.div>

						{/* Photo info at bottom */}
						<div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
							<p className="text-white text-sm font-medium truncate">
								{currentPhoto.name}
							</p>
							<p className="text-white/70 text-xs">
								{new Date(currentPhoto.createdAt).toLocaleString()}
							</p>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Action Buttons */}
			<div className="absolute bottom-8 left-0 right-0 z-10">
				<div className="flex items-center justify-center gap-6">
					<Button
						size="icon"
						variant="destructive"
						className="h-16 w-16 rounded-full shadow-lg"
						onClick={() => handleButtonAction("reject")}
					>
						<X className="h-8 w-8" />
					</Button>

					<Button
						size="icon"
						variant="default"
						className="h-16 w-16 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600"
						onClick={() => handleButtonAction("public")}
					>
						<Globe className="h-8 w-8" />
					</Button>

					<Button
						size="icon"
						variant="default"
						className="h-16 w-16 rounded-full shadow-lg bg-green-500 hover:bg-green-600"
						onClick={() => handleButtonAction("approve")}
					>
						<Check className="h-8 w-8" />
					</Button>
				</div>
			</div>
		</div>
	);
};
