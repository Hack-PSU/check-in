"use client";

import { useState, useMemo } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Scan, MapPin, Clock } from "lucide-react";
import { useAllEvents, EventType } from "@/common/api/event";
import { useAllOrganizers, Role } from "@/common/api/organizer";
import { useAllScans } from "@/common/api/scan";
import { useAllUsers } from "@/common/api/user";

export default function HackathonDashboard() {
	const [selectedHackathon, setSelectedHackathon] = useState<string>("");
	const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState("");

	// Fetch data using provided hooks
	const { data: scans = [], isLoading: scansLoading } =
		useAllScans(selectedHackathon);
	const { data: users = [], isLoading: usersLoading } = useAllUsers(true);
	const { data: organizers = [], isLoading: organizersLoading } =
		useAllOrganizers();
	const { data: events = [], isLoading: eventsLoading } =
		useAllEvents(selectedHackathon);

	const isLoading =
		scansLoading || usersLoading || organizersLoading || eventsLoading;

	// Create lookup maps for better performance
	const userMap = useMemo(
		() => new Map(users.map((user) => [user.id, user])),
		[users]
	);
	const organizerMap = useMemo(
		() => new Map(organizers.map((org) => [org.id, org])),
		[organizers]
	);
	const eventMap = useMemo(
		() => new Map(events.map((event) => [event.id, event])),
		[events]
	);

	// Enhanced scan data with joined information (no fake timestamps)
	const enrichedScans = useMemo(() => {
		return scans
			.map((scan) => ({
				...scan,
				user: userMap.get(scan.userId),
				organizer: organizerMap.get(scan.organizerId),
				event: eventMap.get(scan.eventId),
			}))
			.filter((scan) => scan.user && scan.organizer && scan.event);
	}, [scans, userMap, organizerMap, eventMap]);

	// Filter scans based on selected filters
	const filteredScans = useMemo(() => {
		let filtered = enrichedScans;

		// Filter by event type
		if (eventTypeFilter !== "all") {
			filtered = filtered.filter(
				(scan) => scan.event?.type === eventTypeFilter
			);
		}

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(
				(scan) =>
					scan.event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					scan.user?.firstName
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					scan.user?.lastName
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					scan.organizer?.firstName
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					scan.organizer?.lastName
						.toLowerCase()
						.includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [enrichedScans, eventTypeFilter, searchTerm]);

	// Analytics calculations (only real data)
	const analytics = useMemo(() => {
		const totalScans = filteredScans.length;

		// Event participation
		const eventParticipation = events
			.map((event) => {
				const eventScans = filteredScans.filter(
					(scan) => scan.eventId === event.id
				);
				const uniqueAttendees = new Set(eventScans.map((scan) => scan.userId))
					.size;

				return {
					...event,
					scanCount: eventScans.length,
					uniqueAttendees,
					attendanceRate:
						users.length > 0 ? (uniqueAttendees / users.length) * 100 : 0,
				};
			})
			.filter(
				(event) => eventTypeFilter === "all" || event.type === eventTypeFilter
			)
			.filter(
				(event) =>
					!searchTerm ||
					event.name.toLowerCase().includes(searchTerm.toLowerCase())
			)
			.sort((a, b) => b.uniqueAttendees - a.uniqueAttendees);

		// Organizer activity
		const organizerActivity = organizers
			.map((org) => {
				const orgScans = filteredScans.filter(
					(scan) => scan.organizerId === org.id
				);

				return {
					...org,
					scanCount: orgScans.length,
					name: `${org.firstName} ${org.lastName}`,
					role: Role[org.privilege],
				};
			})
			.filter(
				(org) =>
					!searchTerm ||
					org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					org.email.toLowerCase().includes(searchTerm.toLowerCase())
			)
			.sort((a, b) => b.scanCount - a.scanCount);

		return {
			totalScans,
			eventParticipation,
			organizerActivity,
		};
	}, [filteredScans, events, organizers, users, eventTypeFilter, searchTerm]);

	const eventTypeColors = {
		[EventType.checkIn]: "#10b981",
		[EventType.food]: "#f59e0b",
		[EventType.workshop]: "#3b82f6",
		[EventType.activity]: "#8b5cf6",
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6 pb-24">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Hackathon Dashboard
						</h1>
						<p className="text-gray-600 mt-1">
							Monitor check-ins and event participation
						</p>
					</div>

					{/* Filters */}
					<div className="flex flex-col sm:flex-row gap-3">
						<Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Event Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value={EventType.checkIn}>Check-in</SelectItem>
								<SelectItem value={EventType.food}>Food</SelectItem>
								<SelectItem value={EventType.workshop}>Workshop</SelectItem>
								<SelectItem value={EventType.activity}>Activity</SelectItem>
							</SelectContent>
						</Select>

						<Input
							placeholder="Search..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-[200px]"
						/>
					</div>
				</div>

				{/* Scan Overview */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Scans</CardTitle>
						<Scan className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.totalScans.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							Across {analytics.eventParticipation.length} events with{" "}
							{users.length} registered users
						</p>
					</CardContent>
				</Card>

				{/* Tabs for Events and Organizers */}
				<Tabs defaultValue="events" className="space-y-6">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="events">Events</TabsTrigger>
						<TabsTrigger value="organizers">Organizers</TabsTrigger>
					</TabsList>

					{/* Events Tab */}
					<TabsContent value="events" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Event Participation</CardTitle>
								<CardDescription>Attendance for each event</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics.eventParticipation.map((event, index) => (
										<div
											key={event.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center gap-3 flex-1">
												<div className="text-lg font-semibold text-gray-400 w-8">
													#{index + 1}
												</div>
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h3 className="font-semibold">{event.name}</h3>
														<Badge
															variant="outline"
															className="capitalize"
															style={{
																borderColor:
																	eventTypeColors[event.type as EventType],
																color: eventTypeColors[event.type as EventType],
															}}
														>
															{event.type}
														</Badge>
													</div>

													<div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
														{event.location && (
															<span className="flex items-center gap-1">
																<MapPin className="h-3 w-3" />
																{event.location.name}
															</span>
														)}
														<span className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{new Date(event.startTime).toLocaleTimeString(
																[],
																{
																	hour: "2-digit",
																	minute: "2-digit",
																}
															)}
														</span>
													</div>

													{/* Attendance Progress Bar */}
													<div className="space-y-1">
														<div className="flex justify-between text-sm">
															<span>Attendance</span>
															<span>{event.uniqueAttendees} attendees</span>
														</div>
														<Progress
															value={Math.min(event.attendanceRate, 100)}
															className="h-2"
														/>
														<div className="text-xs text-gray-500">
															{event.attendanceRate.toFixed(1)}% of registered
															users
														</div>
													</div>
												</div>
											</div>

											<div className="text-right ml-4">
												<div className="text-2xl font-bold">
													{event.uniqueAttendees}
												</div>
												<div className="text-sm text-gray-500">unique</div>
												<div className="text-xs text-gray-400">
													{event.scanCount} total scans
												</div>
											</div>
										</div>
									))}

									{analytics.eventParticipation.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											No events found matching your filters
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Organizers Tab */}
					<TabsContent value="organizers" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Organizer Activity</CardTitle>
								<CardDescription>Scan activity by organizer</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics.organizerActivity.map((organizer, index) => (
										<div
											key={organizer.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center gap-3 flex-1">
												<div className="text-lg font-semibold text-gray-400 w-8">
													#{index + 1}
												</div>
												<div className="flex-1">
													<h3 className="font-semibold">{organizer.name}</h3>
													<div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
														<Badge variant="outline">{organizer.role}</Badge>
														<span>{organizer.email}</span>
														{organizer.judgingLocation && (
															<span className="flex items-center gap-1">
																<MapPin className="h-3 w-3" />
																{organizer.judgingLocation}
															</span>
														)}
													</div>

													{/* Scan Count Visualization */}
													<div className="space-y-1">
														<div className="flex justify-between text-sm">
															<span>Scan Activity</span>
															<span>{organizer.scanCount} scans</span>
														</div>
														<div className="w-full bg-gray-200 rounded-full h-2">
															<div
																className="bg-blue-600 h-2 rounded-full transition-all duration-300"
																style={{
																	width: `${Math.min(
																		(organizer.scanCount /
																			Math.max(
																				...analytics.organizerActivity.map(
																					(o) => o.scanCount
																				),
																				1
																			)) *
																			100,
																		100
																	)}%`,
																}}
															/>
														</div>
													</div>
												</div>
											</div>

											<div className="text-right ml-4">
												<div className="text-2xl font-bold">
													{organizer.scanCount}
												</div>
												<div className="text-sm text-gray-500">scans</div>
											</div>
										</div>
									))}

									{analytics.organizerActivity.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											No organizers found matching your filters
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
