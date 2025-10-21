"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
	Calendar,
	Clock,
	MapPin,
	Users,
	Plus,
	Trash2,
	RefreshCw,
	Search,
	X,
	Loader2,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Toaster, toast } from "sonner";
import {
	useReservations,
	useCreateReservation,
	useCancelReservation,
	useLocations,
	ReservationEntity,
	ReservationType,
} from "@/common/api/reservation";
import { useAllTeams } from "@/common/api/team";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";

type SortField = "startTime" | "locationId" | "teamId" | "reservationType";
type SortDirection = "asc" | "desc";

export default function AdminReservations() {
	// State
	const [searchTerm, setSearchTerm] = useState("");
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedReservation, setSelectedReservation] =
		useState<ReservationEntity | null>(null);
	const [sortField, setSortField] = useState<SortField>("startTime");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	// Form state for create/edit
	const [formData, setFormData] = useState({
		locationId: "",
		teamId: "",
		startTime: "",
		endTime: "",
	});

	// Fetch data
	const { data: activeHackathon } = useActiveHackathonForStatic();
	const hackathonId = activeHackathon?.id || "";

	const {
		data: reservations = [],
		isLoading: reservationsLoading,
		refetch: refetchReservations,
	} = useReservations(hackathonId);

	const { data: locations = [] } = useLocations();
	const { data: teams = [] } = useAllTeams();

	// Mutations
	const { mutateAsync: createReservation, isPending: isCreating } =
		useCreateReservation();
	const { mutateAsync: cancelReservation, isPending: isDeleting } =
		useCancelReservation(hackathonId);

	// Helper functions
	const formatTimestamp = (timestamp: number): string => {
		const ms = timestamp > 9999999999 ? timestamp : timestamp * 1000;
		return new Date(ms).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const parseInputToTimestamp = (input: string): number => {
		return new Date(input).getTime();
	};

	const getLocationName = useCallback((locationId: number): string => {
		const location = locations.find((l) => l.id === locationId);
		return location?.name || `Location ${locationId}`;
	}, [locations]);

	const getTeamName = useCallback((teamId: string | null): string => {
		if (!teamId) return "Admin Reservation";
		const team = teams.find((t) => t.id === teamId);
		return team?.name || teamId;
	}, [teams]);

	// Filter and sort reservations
	const filteredReservations = useMemo(() => {
		let filtered = reservations.filter((reservation) => {
			const locationName = getLocationName(reservation.locationId).toLowerCase();
			const teamName = getTeamName(reservation.teamId).toLowerCase();
			const search = searchTerm.toLowerCase();

			const matchesSearch =
				locationName.includes(search) ||
				teamName.includes(search) ||
				reservation.id.toLowerCase().includes(search);

			const matchesType =
				typeFilter === "all" || reservation.reservationType === typeFilter;

			return matchesSearch && matchesType;
		});

		// Sort
		filtered.sort((a, b) => {
			let aVal: any = a[sortField];
			let bVal: any = b[sortField];

			if (sortField === "locationId") {
				aVal = getLocationName(a.locationId);
				bVal = getLocationName(b.locationId);
			} else if (sortField === "teamId") {
				aVal = getTeamName(a.teamId);
				bVal = getTeamName(b.teamId);
			}

			if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [reservations, searchTerm, typeFilter, sortField, sortDirection, getLocationName, getTeamName]);

	// Statistics
	const stats = useMemo(() => {
		const total = reservations.length;
		const admin = reservations.filter(
			(r) => r.reservationType === ReservationType.ADMIN
		).length;
		const participant = reservations.filter(
			(r) => r.reservationType === ReservationType.PARTICIPANT
		).length;
		return { total, admin, participant };
	}, [reservations]);

	// Handlers
	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const handleCreateReservation = async () => {
		try {
			if (!formData.locationId || !formData.startTime || !formData.endTime) {
				toast.error("Please fill all required fields");
				return;
			}

			await createReservation({
				locationId: parseInt(formData.locationId),
				teamId: formData.teamId === "__NONE__" ? "" : formData.teamId,
				startTime: parseInputToTimestamp(formData.startTime),
				endTime: parseInputToTimestamp(formData.endTime),
				hackathonId,
			});

			toast.success("Reservation created successfully!");
			setCreateModalOpen(false);
			setFormData({
				locationId: "",
				teamId: "",
				startTime: "",
				endTime: "",
			});
		} catch (error: any) {
			console.error("Create error:", error);
			toast.error(error?.message || "Failed to create reservation");
		}
	};

	const handleDeleteReservation = async () => {
		if (!selectedReservation) return;

		try {
			await cancelReservation(selectedReservation.id);
			toast.success("Reservation deleted successfully!");
			setDeleteModalOpen(false);
			setSelectedReservation(null);
		} catch (error: any) {
			console.error("Delete error:", error);
			toast.error(error?.message || "Failed to delete reservation");
		}
	};

	const openDeleteModal = (reservation: ReservationEntity) => {
		setSelectedReservation(reservation);
		setDeleteModalOpen(true);
	};

	const resetForm = () => {
		setFormData({
			locationId: "",
			teamId: "",
			startTime: "",
			endTime: "",
		});
	};

	if (reservationsLoading) {
		return (
			<>
				<Toaster position="bottom-right" richColors />
				<div className="min-h-screen flex items-center justify-center p-4 pb-24">
					<Card className="w-full max-w-4xl">
						<CardContent className="p-8 text-center">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
							<p className="text-muted-foreground">Loading reservations...</p>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	return (
		<>
			<Toaster position="bottom-right" richColors />
			<div className="min-h-screen bg-background p-4 pb-24">
				<div className="max-w-7xl mx-auto space-y-6">
					{/* Header */}
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<CardTitle className="text-2xl">
										Reservation Management
									</CardTitle>
									<p className="text-muted-foreground mt-1 text-sm">
										Manage room reservations for the hackathon
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										onClick={() => refetchReservations()}
										variant="outline"
										size="sm"
									>
										<RefreshCw className="h-4 w-4 mr-2" />
										Refresh
									</Button>
									<Button
										onClick={() => {
											resetForm();
											setCreateModalOpen(true);
										}}
										size="sm"
									>
										<Plus className="h-4 w-4 mr-2" />
										New Reservation
									</Button>
								</div>
							</div>
						</CardHeader>
					</Card>

					{/* Statistics */}
					<Card>
						<CardContent className="p-6">
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold">{stats.total}</div>
									<div className="text-sm text-muted-foreground">
										Total Reservations
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-purple-600">
										{stats.admin}
									</div>
									<div className="text-sm text-muted-foreground">
										Admin Reservations
									</div>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{stats.participant}
									</div>
									<div className="text-sm text-muted-foreground">
										Participant Reservations
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Filters */}
					<Card>
						<CardContent className="p-4">
							<div className="flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Search by location, team, or ID..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="w-full sm:w-[200px]">
										<SelectValue placeholder="Filter by type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										<SelectItem value={ReservationType.ADMIN}>
											Admin Only
										</SelectItem>
										<SelectItem value={ReservationType.PARTICIPANT}>
											Participant Only
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Reservations Table */}
					<Card>
						<CardHeader>
							<CardTitle>
								Reservations ({filteredReservations.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{filteredReservations.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									No reservations found
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-muted/50 border-b">
											<tr>
												<th className="text-left p-4 font-medium">
													<button
														onClick={() => handleSort("locationId")}
														className="flex items-center gap-1 hover:text-primary"
													>
														Location
														{sortField === "locationId" &&
															(sortDirection === "asc" ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															))}
													</button>
												</th>
												<th className="text-left p-4 font-medium">
													<button
														onClick={() => handleSort("teamId")}
														className="flex items-center gap-1 hover:text-primary"
													>
														Team
														{sortField === "teamId" &&
															(sortDirection === "asc" ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															))}
													</button>
												</th>
												<th className="text-left p-4 font-medium">
													<button
														onClick={() => handleSort("startTime")}
														className="flex items-center gap-1 hover:text-primary"
													>
														Time
														{sortField === "startTime" &&
															(sortDirection === "asc" ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															))}
													</button>
												</th>
												<th className="text-left p-4 font-medium">
													<button
														onClick={() => handleSort("reservationType")}
														className="flex items-center gap-1 hover:text-primary"
													>
														Type
														{sortField === "reservationType" &&
															(sortDirection === "asc" ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															))}
													</button>
												</th>
												<th className="text-right p-4 font-medium">Actions</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{filteredReservations.map((reservation) => (
												<tr
													key={reservation.id}
													className="hover:bg-muted/30 transition-colors"
												>
													<td className="p-4">
														<div className="flex items-center gap-2">
															<MapPin className="h-4 w-4 text-muted-foreground" />
															<span className="font-medium">
																{getLocationName(reservation.locationId)}
															</span>
														</div>
													</td>
													<td className="p-4">
														<div className="flex items-center gap-2">
															<Users className="h-4 w-4 text-muted-foreground" />
															<span>{getTeamName(reservation.teamId)}</span>
														</div>
													</td>
													<td className="p-4">
														<div className="flex flex-col gap-1">
															<div className="flex items-center gap-2 text-sm">
																<Clock className="h-3 w-3 text-muted-foreground" />
																<span>
																	{formatTimestamp(reservation.startTime)}
																</span>
															</div>
															<div className="flex items-center gap-2 text-sm text-muted-foreground">
																<span className="ml-5">
																	to {formatTimestamp(reservation.endTime)}
																</span>
															</div>
														</div>
													</td>
													<td className="p-4">
														<Badge
															variant={
																reservation.reservationType ===
																ReservationType.ADMIN
																	? "default"
																	: "secondary"
															}
															className={
																reservation.reservationType ===
																ReservationType.ADMIN
																	? "bg-purple-100 text-purple-800"
																	: "bg-blue-100 text-blue-800"
															}
														>
															{reservation.reservationType === ReservationType.ADMIN
																? "Admin"
																: "Participant"}
														</Badge>
													</td>
													<td className="p-4">
														<div className="flex justify-end gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() => openDeleteModal(reservation)}
																className="text-destructive hover:text-destructive"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Create Modal */}
			<Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Create Reservation</DialogTitle>
						<DialogDescription>
							Create a new room reservation for the hackathon
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="location">Location *</Label>
							<Select
								value={formData.locationId}
								onValueChange={(value) =>
									setFormData({ ...formData, locationId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select location" />
								</SelectTrigger>
								<SelectContent className="max-h-[200px]">
									{locations.map((location) => (
										<SelectItem key={location.id} value={location.id.toString()}>
											{location.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="team">Team (Optional for admin reservations)</Label>
							<Select
								value={formData.teamId}
								onValueChange={(value) =>
									setFormData({ ...formData, teamId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select team or leave blank" />
								</SelectTrigger>
								<SelectContent className="max-h-[200px]">
									<SelectItem value="__NONE__">No Team (Admin Reservation)</SelectItem>
									{teams
										.filter((team) => team.isActive)
										.map((team) => (
											<SelectItem key={team.id} value={team.id}>
												{team.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="startTime">Start Time *</Label>
							<Input
								id="startTime"
								type="datetime-local"
								value={formData.startTime}
								onChange={(e) =>
									setFormData({ ...formData, startTime: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endTime">End Time *</Label>
							<Input
								id="endTime"
								type="datetime-local"
								value={formData.endTime}
								onChange={(e) =>
									setFormData({ ...formData, endTime: e.target.value })
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCreateModalOpen(false)}
							disabled={isCreating}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateReservation} disabled={isCreating}>
							{isCreating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								"Create"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Modal */}
			<Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Reservation</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this reservation? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					{selectedReservation && (
						<div className="space-y-3 py-4">
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">
									{getLocationName(selectedReservation.locationId)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span>{getTeamName(selectedReservation.teamId)}</span>
							</div>
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">
									{formatTimestamp(selectedReservation.startTime)} -{" "}
									{formatTimestamp(selectedReservation.endTime)}
								</span>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteModalOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteReservation}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
