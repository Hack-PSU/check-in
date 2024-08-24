"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import QrCodeScanner from "@mui/icons-material/QrCodeScanner";
import LocationIcon from "@mui/icons-material/LocationOn";
import LogoutIcon from "@mui/icons-material/Logout";
import ScanPage from "@/components/scanPage/page";
import { useFirebase } from "@/components/context";
import { useRouter } from "next/navigation";
import OrganizerAnalyticsPage from "@/components/organizerAnalyticsPage/page";
import EventsAnalyticsPage from "@/components/eventAnalyticsPage/page";
import HackathonSummaryPage from "@/components/hackathonAnalyticsPage/page";

export default function SimpleBottomNavigation() {
	const [value, setValue] = React.useState(0);

	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const { logout } = useFirebase();
	const router = useRouter();

	// Function to handle logout
	const handleLogout = async () => {
		await logout();
		router.push("/auth");
	};

	// Function to determine which component to render
	const renderComponent = () => {
		if (!mounted) return null;
		switch (value) {
			case 0:
				return <ScanPage />;
			case 1:
				return <OrganizerAnalyticsPage />;
			case 2:
				return <EventsAnalyticsPage />;
			case 3:
				return <HackathonSummaryPage />;
			case 4:
				return <LocationIcon />;
			default:
				return <ScanPage />;
		}
	};

	return (
		<Box
			sx={{
				paddingBottom: "56px",
			}}
		>
			{renderComponent()}
			<Box
				sx={{
					width: "100vw",
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					zIndex: 1000,
				}}
			>
				<BottomNavigation
					showLabels
					value={value}
					onChange={(event, newValue) => {
						setValue(newValue);
					}}
					sx={{
						width: "100%", // Make BottomNavigation take full width
						boxShadow: "0 -1px 3px rgba(0,0,0,0.2)", // Optional: adds a slight shadow for better visual separation
					}}
				>
					<BottomNavigationAction label="Scanner" icon={<QrCodeScanner />} />
					<BottomNavigationAction label="Analytics" icon={<LocationIcon />} />
					<BottomNavigationAction label="Events" icon={<LocationIcon />} />
					<BottomNavigationAction label="Summary" icon={<LocationIcon />} />
					<BottomNavigationAction
						label="Log Out"
						icon={<LogoutIcon />}
						onClick={handleLogout}
					/>
				</BottomNavigation>
			</Box>
		</Box>
	);
}
