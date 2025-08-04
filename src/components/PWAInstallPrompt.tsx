"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const [isIOS, setIsIOS] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);

	useEffect(() => {
		// Check if running on iOS
		const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		setIsIOS(iOS);

		// Check if already installed (standalone mode)
		const standalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as any).standalone === true;
		setIsStandalone(standalone);

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);

			// Show prompt after a delay if not already dismissed
			const dismissed = localStorage.getItem("pwa-install-dismissed");
			if (!dismissed && !standalone) {
				setTimeout(() => setShowPrompt(true), 3000);
			}
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		// For iOS, show manual install instructions if not standalone
		if (iOS && !standalone) {
			const dismissed = localStorage.getItem("pwa-install-dismissed-ios");
			if (!dismissed) {
				setTimeout(() => setShowPrompt(true), 3000);
			}
		}

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setDeferredPrompt(null);
			setShowPrompt(false);
		}
	};

	const handleDismiss = () => {
		setShowPrompt(false);
		if (isIOS) {
			localStorage.setItem("pwa-install-dismissed-ios", "true");
		} else {
			localStorage.setItem("pwa-install-dismissed", "true");
		}
	};

	// Don't show if already installed or prompt not available
	if (isStandalone || (!deferredPrompt && !isIOS) || !showPrompt) {
		return null;
	}

	return (
		<div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
			<Card className="border-2 border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<Download className="h-5 w-5 text-primary" />
							<CardTitle className="text-lg">Install App</CardTitle>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDismiss}
							className="h-6 w-6 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<CardDescription>
						{isIOS
							? "Add HackPSU Check-in to your home screen for quick access"
							: "Install HackPSU Check-in for a better experience"}
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					{isIOS ? (
						<div className="space-y-2 text-sm text-muted-foreground">
							<p>To install:</p>
							<ol className="list-decimal list-inside space-y-1 ml-2">
								<li>Tap the Share button in Safari</li>
								<li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
								<li>Tap &quot;Add&quot; to install</li>
							</ol>
						</div>
					) : (
						<Button onClick={handleInstallClick} className="w-full">
							<Download className="mr-2 h-4 w-4" />
							Install Now
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
