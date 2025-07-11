"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";
import { RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import {
	useAllFlags,
	useActivateFlag,
	usePatchFlags,
} from "@/common/api/flag/hook";
import type { PatchFlagsBody } from "@/common/api/flag/entity";

export default function FlagManagement() {
	const [isUpdatingAll, setIsUpdatingAll] = useState(false);
	const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(
		new Map()
	);

	const {
		data: flags = [],
		isLoading: flagsLoading,
		isError: flagsError,
		refetch: refetchFlags,
	} = useAllFlags();

	const { mutate: activateFlag } = useActivateFlag();
	const { mutate: patchFlags } = usePatchFlags();

	// Handle individual flag toggle
	const handleFlagToggle = (flagName: string, newState: boolean) => {
		activateFlag(
			{
				name: flagName,
				isEnabled: newState,
			},
			{
				onSuccess: () => {
					toast.success(
						`Flag "${flagName}" ${newState ? "enabled" : "disabled"} successfully!`
					);
				},
				onError: (err: any) => {
					console.error(err);
					toast.error(
						`Error updating flag "${flagName}": ${err.message || err}`
					);
				},
			}
		);
	};

	// Handle refresh
	const handleRefresh = () => {
		refetchFlags();
		toast.info("Refreshing flags...");
	};

	// Get flag statistics
	const enabledCount = flags.filter((flag) => flag.isEnabled).length;
	const totalCount = flags.length;

	if (flagsLoading) {
		return (
			<>
				<Toaster position="bottom-right" richColors />
				<div className="min-h-screen flex items-center justify-center p-4 pb-24">
					<Card className="w-full max-w-4xl">
						<CardContent className="p-8 text-center">
							<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
							<p className="text-muted-foreground">Loading flags...</p>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	if (flagsError) {
		return (
			<>
				<Toaster position="bottom-right" richColors />
				<div className="min-h-screen flex items-center justify-center p-4 pb-24">
					<Card className="w-full max-w-4xl">
						<CardContent className="p-8 text-center">
							<p className="text-destructive mb-4">Error loading flags</p>
							<Button onClick={handleRefresh} variant="outline">
								<RefreshCw className="h-4 w-4 mr-2" />
								Retry
							</Button>
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
				<div className="max-w-4xl mx-auto space-y-6">
					{/* Header */}
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div className="flex items-center space-x-3">
									<div>
										<CardTitle className="text-xl sm:text-2xl">
											Feature Flags Management
										</CardTitle>
										<p className="text-muted-foreground mt-1 text-sm sm:text-base">
											Manage and monitor your application feature flags
										</p>
									</div>
								</div>
								<Button
									onClick={handleRefresh}
									variant="outline"
									size="sm"
									className="w-fit bg-transparent"
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Refresh
								</Button>
							</div>
						</CardHeader>
					</Card>

					{/* Statistics */}
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="grid grid-cols-3 gap-2 sm:gap-4">
								<div className="text-center">
									<div className="text-xl sm:text-2xl font-bold">
										{totalCount}
									</div>
									<div className="text-xs sm:text-sm text-muted-foreground">
										Total Flags
									</div>
								</div>
								<div className="text-center">
									<div className="text-xl sm:text-2xl font-bold text-green-600">
										{enabledCount}
									</div>
									<div className="text-xs sm:text-sm text-muted-foreground">
										Enabled
									</div>
								</div>
								<div className="text-center">
									<div className="text-xl sm:text-2xl font-bold text-red-600">
										{totalCount - enabledCount}
									</div>
									<div className="text-xs sm:text-sm text-muted-foreground">
										Disabled
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Flags List */}
					<Card>
						<CardHeader>
							<CardTitle>Feature Flags ({flags.length})</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							{flags.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									No feature flags found
								</div>
							) : (
								<div className="divide-y">
									{flags.map((flag, index) => (
										<div key={flag.name} className="p-4 sm:p-6">
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
												<div className="flex-1 min-w-0">
													<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
														<h4 className="font-medium text-base sm:text-lg truncate pr-2">
															{flag.name}
														</h4>
														<Badge
															variant={flag.isEnabled ? "default" : "secondary"}
															className={`w-fit ${flag.isEnabled ? "bg-green-100 text-green-800" : ""}`}
														>
															{flag.isEnabled ? "Enabled" : "Disabled"}
														</Badge>
													</div>
													<p className="text-sm text-muted-foreground mt-1">
														Status: {flag.isEnabled ? "Active" : "Inactive"}
													</p>
												</div>
												<div className="flex items-center justify-between sm:justify-end">
													<div className="flex items-center space-x-2">
														<Label
															htmlFor={`flag-${flag.name}`}
															className="text-sm"
														>
															{flag.isEnabled ? "On" : "Off"}
														</Label>
														<Switch
															id={`flag-${flag.name}`}
															checked={flag.isEnabled}
															onCheckedChange={(checked) =>
																handleFlagToggle(flag.name, checked)
															}
														/>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
