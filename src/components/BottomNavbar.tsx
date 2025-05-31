import React, { useState } from "react";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import GavelIcon from "@mui/icons-material/Gavel";
import LogoutIcon from "@mui/icons-material/Logout";
import LaptopIcon from "@mui/icons-material/Laptop";
import { useFirebase } from "@/common/context";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav() {
	const { logout } = useFirebase();
	const router = useRouter();
	const pathname = usePathname();

	const pathToIndex: Record<string, number> = {
		"/scan": 0,
		"/manual": 1,
		"/judging": 2,
		"/auth": 3,
		"/logs": 4,
	};

	const [currentIndex, setCurrentIndex] = useState(
		pathToIndex[pathname] !== undefined ? pathToIndex[pathname] : 0
	);

	const handleChange = async (
		_event: React.SyntheticEvent,
		newValue: number
	) => {
		setCurrentIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/scan");
				break;
			case 1:
				router.push("/manual");
				break;
			case 2:
				router.push("/judging");
				break;
			case 3:
				await logout();
				router.push("/auth");
				break;
			case 4:
				router.push("/logs");
				break;
			default:
				break;
		}
	};

	return (
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
				value={currentIndex}
				onChange={handleChange}
				sx={{
					width: "100%",
					boxShadow: "0 -1px 3px rgba(0, 0, 0, 0.2)",
				}}
			>
				<BottomNavigationAction label="Scanner" icon={<QrCodeScannerIcon />} />
				<BottomNavigationAction
					label="Manual Check In"
					icon={<AssignmentIndIcon />}
				/>
				<BottomNavigationAction label="Judging" icon={<GavelIcon />} />
				<BottomNavigationAction label="Log Out" icon={<LogoutIcon />} />
				<BottomNavigationAction label="Logs" icon={<LaptopIcon />} />
			</BottomNavigation>
		</Box>
	);
}
