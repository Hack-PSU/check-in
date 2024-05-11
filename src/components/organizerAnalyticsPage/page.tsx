"use client";

import React, { useEffect, useState } from "react";
import {
	Container,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { AnalyticsScansResponse, getAnalyticsScans } from "@/common/api/analytics";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const OrganizerAnalyticsPage = () => {
	const [scanData, setScanData] = useState<AnalyticsScansResponse[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			const response = await getAnalyticsScans();
			setScanData(response.data);
		};

		fetchData();
	}, []);

	const data = {
		labels: scanData.map((data) => `${data.firstName} ${data.lastName}`),
		datasets: [
			{
				label: "Number of Scans",
				data: scanData.map((data) => data.count),
				backgroundColor: "rgba(53, 162, 235, 0.5)",
			},
		],
	};

	const options = {
		scales: {
			y: {
				beginAtZero: true,
			},
		},
		plugins: {
			legend: {
				display: true,
			},
		},
	};

	return (
		<Container maxWidth="md">
			<Typography variant="h4" component="h1" gutterBottom>
				Scan Analytics by Organizer
			</Typography>
			<Paper sx={{ padding: 2, marginBottom: 2 }}>
				<Typography variant="h6" gutterBottom component="div">
					Scans Overview
				</Typography>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Organizer</TableCell>
							<TableCell align="right">Number of Scans</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{scanData.map((row) => (
							<TableRow key={row.id}>
								<TableCell component="th" scope="row">
									{`${row.firstName} ${row.lastName}`}
								</TableCell>
								<TableCell align="right">{row.count}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>
			<Paper>
				<Typography variant="h6" gutterBottom component="div">
					Scans Chart
				</Typography>
				<Bar data={data} options={options} />
			</Paper>
		</Container>
	);
};

export default OrganizerAnalyticsPage;
