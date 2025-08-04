import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/common/context";
import { BottomNav } from "@/components/BottomNavbar";
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
		title: "HackPSU Check-in"
	},
	formatDetection: {
		telephone: false
	},
	icons: {
		shortcut: "/favicon.ico",
		apple: [
			{ url: "/logo.svg", sizes: "152x152" },
			{ url: "/logo.svg", sizes: "192x192" }
		]
	}
};

export const viewport: Viewport = {
	themeColor: "#000000"
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="HackPSU Check-in" />
				<link rel="apple-touch-icon" href="/logo.svg" />
			</head>
			<body className={inter.className}>
				<LayoutProvider>
					{children}
					<BottomNav />
					<Toaster richColors position="bottom-right" />
				</LayoutProvider>
				<Analytics />
			</body>
		</html>
	);
}
