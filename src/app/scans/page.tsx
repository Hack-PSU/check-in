"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ScanPage from "@/components/scanPage/page";
import ManualCheckIn from "@/components/manualCheckIn/page";
import GavelIcon from "@mui/icons-material/Gavel";
import { useFirebase } from "@/components/context";
import { useRouter } from "next/navigation";
import JudgingPage from "@/components/judgingPage/page";

export default function SimpleBottomNavigation() {
	const [value, setValue] = useState(0);
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
				return <ManualCheckIn />;
			case 2:
				return <JudgingPage />;
			default:
				return null;
		}
	};

	return (
		<Box sx={{ paddingBottom: "56px" }}>
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
						if (newValue === 3) {
							handleLogout();
						} else {
							setValue(newValue);
						}
					}}
					sx={{
						width: "100%",
						boxShadow: "0 -1px 3px rgba(0, 0, 0, 0.2)",
					}}
				>
					<BottomNavigationAction
						label="Scanner"
						icon={<QrCodeScannerIcon />}
					/>
					<BottomNavigationAction
						label="Manual Check In"
						icon={<AssignmentIndIcon />}
					/>
					<BottomNavigationAction label="Judging" icon={<GavelIcon />} />
					<BottomNavigationAction label="Log Out" icon={<LogoutIcon />} />
				</BottomNavigation>
			</Box>
		</Box>
	);
}
