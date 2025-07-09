import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/common/context";
import { BottomNav } from "@/components/BottomNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "HackPSU check-in App",
	description: "HackPSU check in app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<LayoutProvider>
					{children}
					<BottomNav />
				</LayoutProvider>
			</body>
		</html>
	);
}
