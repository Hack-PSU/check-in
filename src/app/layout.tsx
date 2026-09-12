import { HackPSUProvider, Role } from "@hackpsu/react-sdk";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNavbar";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "HackPSU Check-in App",
	description: "HackPSU check-in application for event management and judging",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "HackPSU Check-in",
	},
	formatDetection: {
		telephone: false,
	},
	icons: {
		shortcut: "/favicon.ico",
		apple: [
			{ url: "/logo.svg", sizes: "152x152" },
			{ url: "/logo.svg", sizes: "192x192" },
		],
	},
};

export const viewport: Viewport = {
	themeColor: "#ffffff",
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
				/>
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="HackPSU Check-in" />
				<link rel="apple-touch-icon" href="/logo.svg" />
			</head>
			<body className={inter.className}>
				<HackPSUProvider
					config={{
						firebase: {
							apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
							authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
							databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
							projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
							storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
							messagingSenderId:
								process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
							appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
						},
						apiBaseUrl: process.env.NEXT_PUBLIC_BASE_URL_V3!,
						authServiceUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
						minimumRole: Role.TEAM,
					}}
				>
					{children}
					<BottomNav />
					<Toaster richColors position="bottom-right" />
				</HackPSUProvider>
				<Analytics />
			</body>
		</html>
	);
}
