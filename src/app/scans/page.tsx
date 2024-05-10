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

export default function SimpleBottomNavigation() {
	const [value, setValue] = React.useState(0);
	const { logout } = useFirebase();
	const router = useRouter();

	// Function to handle logout
	const handleLogout = async () => {
		await logout();
		router.push("/auth");
	};

	// Function to determine which component to render
	const renderComponent = () => {
		switch (value) {
			case 0:
				return <ScanPage />;
			case 1:
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
