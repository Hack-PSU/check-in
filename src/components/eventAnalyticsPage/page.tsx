"use client";

import React, { useEffect, useState } from "react";
import {
	Container,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Paper,
} from "@mui/material";
import {
	AnalyticsEventsResponse,
	getAnalyticsEvents,
} from "@/common/api/analytics";

const EventsAnalyticsPage: React.FC = () => {
	const [eventsData, setEventsData] = useState<AnalyticsEventsResponse[]>([]);

	useEffect(() => {
		const fetchEventsData = async () => {
			try {
				const response = await getAnalyticsEvents();
        response.data.sort((a, b) => b.count - a.count);
				setEventsData(response.data);
			} catch (error) {
				console.error("Failed to fetch events data:", error);
			}
		};

		fetchEventsData();
	}, []);

	return (
		<Container maxWidth="lg">
			<Typography variant="h4" component="h1" sx={{ mb: 4 }}>
				Event Scan Analytics
			</Typography>
			<Paper sx={{ width: "100%", overflow: "hidden" }}>
				<Table aria-label="simple table">
					<TableHead>
						<TableRow>
							<TableCell>Event Name</TableCell>
							<TableCell align="center">Event Type</TableCell>
							<TableCell align="right">Number of Scans</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{eventsData.map((event) => (
							<TableRow key={event.id}>
								<TableCell component="th" scope="row">
									{event.name}
								</TableCell>
								<TableCell align="center">{event.type}</TableCell>
								<TableCell align="right">{event.count}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>
		</Container>
	);
};

export default EventsAnalyticsPage;
