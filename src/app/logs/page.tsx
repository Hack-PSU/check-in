"use client";
import React, { useEffect, useState } from "react";
import { useAllScans } from "@/common/api/scan/hook";
import { useAllUsers } from "@/common/api/user/hook";
import { useAllEvents } from "@/common/api/event/hook";
import { useAllOrganizers } from "@/common/api/organizer/hook";
import { CheckInLogEntry } from "@/common/types/log";
import CheckInLogTable from "@/components/CheckInLogTable";

const LogsPage: React.FC = () => {
	const {
		data: scans,
		isLoading: isLoadingScans,
		error: errorScans,
	} = useAllScans();
	const {
		data: users,
		isLoading: isLoadingUsers,
		error: errorUsers,
	} = useAllUsers();
	const {
		data: events,
		isLoading: isLoadingEvents,
		error: errorEvents,
	} = useAllEvents();
	const {
		data: organizers,
		isLoading: isLoadingOrganizers,
		error: errorOrganizers,
	} = useAllOrganizers();

	const [logEntries, setLogEntries] = useState<CheckInLogEntry[]>([]);

	useEffect(() => {
		if (
			scans &&
			users &&
			events &&
			organizers &&
			!errorScans &&
			!errorUsers &&
			!errorEvents &&
			!errorOrganizers
		) {
			const processedEntries: CheckInLogEntry[] = scans.map((scan) => {
				const user = users.find((u) => u.id === scan.userId);
				const event = events.find((e) => e.id === scan.eventId);
				const organizer = organizers.find((o) => o.id === scan.organizerId);

				// Assuming scan.id can be used as scanId. If not, a composite key or backend-generated ID is needed.
				// Assuming ScanEntity has a 'createdAt' or similar timestamp. Using Date.now() as a fallback.
				return {
					scanId: `${scan.eventId}-${scan.userId}-${scan.organizerId}`, // Placeholder scanId
					userEmail: user?.email || "Unknown User",
					userName: `${user?.firstName} ${user?.lastName}` || "Unknown User",
					eventName: event?.name || "Unknown Event",
					organizerEmail: `${organizer?.email}` || "Unknown Organizer",
					organizerName:
						`${organizer?.firstName} ${organizer?.lastName}` ||
						"Unknown Organizer",
					timestamp: Date.now(), // Placeholder timestamp
					hackathonId: event?.hackathonId, // Assuming event has hackathonId
				};
			});
			setLogEntries(processedEntries);
		}
	}, [
		scans,
		users,
		events,
		organizers,
		errorScans,
		errorUsers,
		errorEvents,
		errorOrganizers,
	]);

	if (
		isLoadingScans ||
		isLoadingUsers ||
		isLoadingEvents ||
		isLoadingOrganizers
	) {
		return (
			<div className="flex justify-center items-center h-screen">
				<p className="text-lg text-gray-500">Loading check-in logs...</p>
			</div>
		);
	}

	if (errorScans || errorUsers || errorEvents || errorOrganizers) {
		return (
			<div className="flex justify-center items-center h-screen">
				<p className="text-lg text-red-500">
					Error loading data. Please try again later.
				</p>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8">
			<h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
				Check-in Logs
			</h1>
			{logEntries.length === 0 ? (
				<div className="flex justify-center items-center py-10">
					<p className="text-lg text-gray-500">No check-in logs found.</p>
				</div>
			) : (
				<CheckInLogTable data={logEntries} />
			)}
		</div>
	);
};

export default LogsPage;
