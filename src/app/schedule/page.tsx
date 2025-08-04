"use client";

import { useState, useMemo } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Calendar,
	Clock,
	MapPin,
	Users,
	Utensils,
	GraduationCap,
	Activity,
	RefreshCw,
} from "lucide-react";
import { type EventEntityResponse, EventType } from "@/common/api/event/entity";
import { useAllEvents } from "@/common/api/event/hook";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";

const eventTypeConfig = {
	[EventType.activity]: {
		icon: Activity,
		color: "bg-blue-100 text-blue-800 border-blue-200",
		bgColor: "bg-blue-50",
	},
	[EventType.food]: {
		icon: Utensils,
		color: "bg-green-100 text-green-800 border-green-200",
		bgColor: "bg-green-50",
	},
	[EventType.workshop]: {
		icon: GraduationCap,
		color: "bg-purple-100 text-purple-800 border-purple-200",
		bgColor: "bg-purple-50",
	},
	[EventType.checkIn]: {
		icon: Users,
		color: "bg-orange-100 text-orange-800 border-orange-200",
		bgColor: "bg-orange-50",
	},
};

export default function EventSchedule() {
	const [selectedEvent, setSelectedEvent] =
		useState<EventEntityResponse | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const { data: hackathon } = useActiveHackathonForStatic();
	const { data: events = [], isLoading, refetch } = useAllEvents(hackathon?.id);

	const { day1Events, day2Events, day3Events, eventDays } = useMemo(() => {
		if (!events.length)
			return { day1Events: [], day2Events: [], day3Events: [], eventDays: [] };

		// Sort events by start time
		const sortedEvents = [...events].sort((a, b) => a.startTime - b.startTime);

		// Group events by day
		const eventsByDay = new Map<string, EventEntityResponse[]>();
		const days = new Set<string>();

		sortedEvents.forEach((event) => {
			const date = new Date(event.startTime);
			const dayKey = date.toDateString();
			days.add(dayKey);

			if (!eventsByDay.has(dayKey)) {
				eventsByDay.set(dayKey, []);
			}
			eventsByDay.get(dayKey)!.push(event);
		});

		// Sort days chronologically
		const eventDays = Array.from(days).sort(
			(a, b) => new Date(a).getTime() - new Date(b).getTime()
		);
		const day1Events = eventsByDay.get(eventDays[0]) || [];
		const day2Events = eventsByDay.get(eventDays[1]) || [];
		const day3Events = eventsByDay.get(eventDays[2]) || [];

		return { day1Events, day2Events, day3Events, eventDays };
	}, [events]);

	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const formatDateLong = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
		});
	};

	const getDuration = (startTime: number, endTime: number) => {
		const duration = (endTime - startTime) / (1000 * 60); // minutes
		if (duration < 60) {
			return `${duration}m`;
		}
		const hours = Math.floor(duration / 60);
		const minutes = duration % 60;
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	};

	const isEventActive = (event: EventEntityResponse) => {
		const now = Date.now();
		return now >= event.startTime && now <= event.endTime;
	};

	const isEventUpcoming = (event: EventEntityResponse) => {
		const now = Date.now();
		const thirtyMinutes = 30 * 60 * 1000;
		return event.startTime > now && event.startTime <= now + thirtyMinutes;
	};

	const handleEventClick = (event: EventEntityResponse) => {
		setSelectedEvent(event);
		setIsSheetOpen(true);
	};

	const EventCard = ({ event }: { event: EventEntityResponse }) => {
		const config = eventTypeConfig[event.type];
		const Icon = config.icon;
		const isActive = isEventActive(event);
		const isUpcoming = isEventUpcoming(event);

		return (
			<Card
				className={`transition-all hover:shadow-md cursor-pointer ${
					isActive ? "ring-2 ring-primary shadow-lg" : ""
				} ${config.bgColor}`}
				onClick={() => handleEventClick(event)}
			>
				<CardContent className="p-3 sm:p-4">
					<div className="flex items-start justify-between mb-2">
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<Icon className="h-4 w-4 flex-shrink-0" />
							<h3 className="font-semibold text-sm truncate">{event.name}</h3>
						</div>
						<div className="flex items-center gap-1 flex-shrink-0 ml-2">
							{isActive && (
								<Badge className="bg-green-500 text-white text-xs">Live</Badge>
							)}
							{isUpcoming && (
								<Badge variant="outline" className="text-xs">
									Soon
								</Badge>
							)}
						</div>
					</div>

					<div className="space-y-1 text-xs text-muted-foreground">
						<div className="flex items-center gap-1">
							<Clock className="h-3 w-3 flex-shrink-0" />
							<span className="truncate">
								{formatTime(event.startTime)} - {formatTime(event.endTime)}
							</span>
							<span className="text-xs flex-shrink-0">
								({getDuration(event.startTime, event.endTime)})
							</span>
						</div>

						{event.location && (
							<div className="flex items-center gap-1">
								<MapPin className="h-3 w-3 flex-shrink-0" />
								<span className="truncate">{event.location.name}</span>
							</div>
						)}

						<div className="flex items-center justify-between mt-2">
							<Badge variant="outline" className={`text-xs ${config.color}`}>
								{event.type}
							</Badge>
							{event.wsPresenterNames && (
								<span className="text-xs text-muted-foreground truncate ml-2">
									{event.wsPresenterNames}
								</span>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	const DaySchedule = ({
		events,
		dayTitle,
	}: {
		events: EventEntityResponse[];
		dayTitle: string;
	}) => (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">{dayTitle}</h3>
				<Badge variant="outline">{events.length} events</Badge>
			</div>
			<ScrollArea className="h-[500px] sm:h-[600px]">
				<div className="space-y-3 pr-2 sm:pr-4">
					{events.length > 0 ? (
						events.map((event) => <EventCard key={event.id} event={event} />)
					) : (
						<Card>
							<CardContent className="p-6 text-center">
								<p className="text-muted-foreground">
									No events scheduled for this day
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</ScrollArea>
		</div>
	);

	const EventDetailsSheet = () => {
		if (!selectedEvent) return null;

		const config = eventTypeConfig[selectedEvent.type];
		const Icon = config.icon;

		return (
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent className="w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2 text-left">
							<Icon className="h-5 w-5" />
							<span className="truncate">{selectedEvent.name}</span>
						</SheetTitle>
						<SheetDescription className="text-left">
							{formatDateLong(new Date(selectedEvent.startTime).toDateString())}
						</SheetDescription>
					</SheetHeader>

					<div className="mt-6 space-y-6">
						{/* Time and Location */}
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm">
								<Clock className="h-4 w-4" />
								<span>
									{formatTime(selectedEvent.startTime)} -{" "}
									{formatTime(selectedEvent.endTime)}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Calendar className="h-4 w-4" />
								<span>
									{new Date(selectedEvent.startTime).toLocaleDateString()}
								</span>
							</div>
							{selectedEvent.location && (
								<div className="flex items-center gap-2 text-sm">
									<MapPin className="h-4 w-4" />
									<span>{selectedEvent.location.name}</span>
								</div>
							)}
						</div>

						{/* Event Type and Duration */}
						<div className="flex items-center justify-between">
							<Badge className={config.color}>{selectedEvent.type}</Badge>
							<span className="text-sm text-muted-foreground">
								Duration:{" "}
								{getDuration(selectedEvent.startTime, selectedEvent.endTime)}
							</span>
						</div>

						{/* Description */}
						{selectedEvent.description && (
							<div>
								<h4 className="font-medium mb-2">Description</h4>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{selectedEvent.description}
								</p>
							</div>
						)}

						{/* Workshop Details */}
						{selectedEvent.type === EventType.workshop && (
							<div className="space-y-4">
								{selectedEvent.wsPresenterNames && (
									<div>
										<h4 className="font-medium mb-1">Presenter</h4>
										<p className="text-sm">{selectedEvent.wsPresenterNames}</p>
									</div>
								)}
								{selectedEvent.wsRelevantSkills && (
									<div>
										<h4 className="font-medium mb-1">Skills Covered</h4>
										<p className="text-sm">{selectedEvent.wsRelevantSkills}</p>
									</div>
								)}
								{selectedEvent.wsSkillLevel && (
									<div>
										<h4 className="font-medium mb-1">Skill Level</h4>
										<Badge variant="outline">
											{selectedEvent.wsSkillLevel}
										</Badge>
									</div>
								)}
								{selectedEvent.wsUrls && selectedEvent.wsUrls.length > 0 && (
									<div>
										<h4 className="font-medium mb-2">Resources</h4>
										<div className="space-y-2">
											{selectedEvent.wsUrls.map((url, index) => (
												<a
													key={index}
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-primary hover:underline block break-all"
												>
													{url}
												</a>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet>
		);
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-center">
						<RefreshCw className="h-6 w-6 animate-spin mr-2" />
						<span>Loading schedule...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="container mx-auto p-6 pb-24 space-y-4 sm:space-y-6">
			{/* Header */}
			<Card>
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							<CardTitle className="text-xl sm:text-2xl">
								Event Schedule
							</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={() => refetch()}>
								<RefreshCw className="h-4 w-4 mr-2" />
								Refresh
							</Button>
						</div>
					</div>
					<CardDescription>
						{events.length} events scheduled across {eventDays.length} day
						{eventDays.length !== 1 ? "s" : ""}
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Schedule Tabs */}
			<Tabs defaultValue="day1" className="space-y-4">
				<TabsList
					className={`grid w-full ${eventDays.length === 3 ? "grid-cols-3" : eventDays.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
				>
					{eventDays.map((day, index) => (
						<TabsTrigger
							key={`day${index + 1}`}
							value={`day${index + 1}`}
							className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
						>
							<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
							<span className="hidden sm:inline">{formatDateLong(day)}</span>
							<span className="sm:hidden">{formatDate(day)}</span>
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="day1">
					<Card>
						<CardContent className="p-4 sm:p-6">
							<DaySchedule
								events={day1Events}
								dayTitle={eventDays[0] ? formatDateLong(eventDays[0]) : "Day 1"}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="day2">
					<Card>
						<CardContent className="p-4 sm:p-6">
							<DaySchedule
								events={day2Events}
								dayTitle={eventDays[1] ? formatDateLong(eventDays[1]) : "Day 2"}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				{eventDays.length >= 3 && (
					<TabsContent value="day3">
						<Card>
							<CardContent className="p-4 sm:p-6">
								<DaySchedule
									events={day3Events}
									dayTitle={
										eventDays[2] ? formatDateLong(eventDays[2]) : "Day 3"
									}
								/>
							</CardContent>
						</Card>
					</TabsContent>
				)}
			</Tabs>

			{/* Event Details Sheet */}
			<EventDetailsSheet />
		</div>
	);
}
