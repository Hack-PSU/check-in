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
	CircularProgress,
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
import {
	getAnalyticsSummary,
	AnalyticsSummaryResponse,
} from "@/common/api/analytics";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const HackathonSummaryPage: React.FC = () => {
	const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchSummary = async () => {
			try {
				const response = await getAnalyticsSummary();
				setSummary(response.data);
			} catch (error) {
				console.error("Failed to fetch summary:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSummary();
	}, []);

	if (loading) {
		return (
			<Container
				maxWidth="sm"
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<CircularProgress />
			</Container>
		);
	}

	const createChartData = (labels: string[], data: number[]) => ({
		labels,
		datasets: [
			{
				label: "Count",
				data: data,
				backgroundColor: "rgba(53, 162, 235, 0.5)",
			},
		],
	});

	return (
		<Container maxWidth="lg">
			<Typography variant="h4" component="h1" gutterBottom>
				Hackathon Summary Analytics
			</Typography>
			{summary && (
				<>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							Registration Counts by Event
						</Typography>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Event</TableCell>
									<TableCell align="right">Registrations</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{summary.registrations.map((row) => (
									<TableRow key={row.id}>
										<TableCell>{row.name}</TableCell>
										<TableCell align="right">{row.count}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Paper>
					<Bar
						data={createChartData(
							summary.gender.map((g) => g.gender),
							summary.gender.map((g) => g.count)
						)}
						options={{
							plugins: { legend: { display: false } },
							scales: { y: { beginAtZero: true } },
						}}
					/>
					<Bar
						data={createChartData(
							summary.race.map((r) => r.race),
							summary.race.map((r) => r.count)
						)}
						options={{
							plugins: { legend: { display: false } },
							scales: { y: { beginAtZero: true } },
						}}
					/>
					<Bar
						data={createChartData(
							summary.academicYear.map((a) => a.academicYear),
							summary.academicYear.map((a) => a.count)
						)}
						options={{
							plugins: { legend: { display: false } },
							scales: { y: { beginAtZero: true } },
						}}
					/>
					<Bar
						data={createChartData(
							summary.codingExp.map((c) => c.codingExperience),
							summary.codingExp.map((c) => c.count)
						)}
						options={{
							plugins: { legend: { display: false } },
							scales: { y: { beginAtZero: true } },
						}}
					/>
				</>
			)}
		</Container>
	);
};

export default HackathonSummaryPage;
