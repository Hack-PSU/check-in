"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Send, AlertCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/common/context";
import { useAllOrganizers } from "@/common/api/organizer/hook";
import { useFlagState } from "@/common/api/flag/hook";

interface FormData {
	name: string;
	email: string;
	honeypot: string;
}

export default function AttendancePage() {
	const { user } = useFirebase();
	const { data: organizers = [], isLoading: organizersLoading } =
		useAllOrganizers();
	const { data: techAttendanceFlag, isLoading: flagLoading } =
		useFlagState("TechAttendance");

	const [formData, setFormData] = useState<FormData>({
		name: "",
		email: "",
		honeypot: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	// Auto-populate form data based on current user
	useEffect(() => {
		if (user && organizers.length > 0) {
			const currentOrganizer = organizers.find(
				(org) => org.email === user.email
			);
			if (currentOrganizer) {
				setFormData((prev) => ({
					...prev,
					name: `${currentOrganizer.firstName} ${currentOrganizer.lastName}`,
					email: currentOrganizer.email,
				}));
			}
		}
	}, [user, organizers]);

	const handleInputChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const validateForm = (): boolean => {
		const requiredFields = ["name", "email"];
		const missingFields = requiredFields.filter(
			(field) => !formData[field as keyof FormData]
		);

		if (missingFields.length > 0) {
			toast.error(
				`Please fill in all required fields: ${missingFields.join(", ")}`
			);
			return false;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("Please enter a valid email address");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		// Check if TechAttendance flag is enabled
		if (!techAttendanceFlag?.isEnabled) {
			toast.error(
				"Attendance submission is currently disabled. Please try again later."
			);
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(
				"https://us-east4-hackpsu-408118.cloudfunctions.net/ext-http-export-sheets-3ezm-saveRecord",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: formData.name,
						email: formData.email,
						honeypot: formData.honeypot,
						formType: "tech-attendance",
						timestamp: new Date().toISOString(),
					}),
				}
			);

			if (response.ok) {
				toast.success(
					"Attendance submitted successfully! Thank you for checking in."
				);
				setSubmitted(true);
			} else {
				throw new Error("Failed to submit attendance");
			}
		} catch (error) {
			console.error("Error submitting attendance:", error);
			toast.error(
				"Failed to submit attendance. Please try again or contact an admin."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (organizersLoading || flagLoading) {
		return (
			<div className="min-h-screen bg-gray-50 p-6 pb-24">
				<div className="max-w-2xl mx-auto">
					<Card className="text-center">
						<CardContent className="p-8">
							<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<UserCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
							</div>
							<h1 className="text-2xl font-bold text-gray-900 mb-4">
								Loading...
							</h1>
							<p className="text-muted-foreground">
								Please wait while we load your information.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (submitted) {
		return (
			<div className="min-h-screen bg-gray-50 p-6 pb-24">
				<div className="max-w-2xl mx-auto">
					<Card className="text-center">
						<CardContent className="p-8">
							<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<ClipboardCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
							</div>
							<h1 className="text-2xl font-bold text-gray-900 mb-4">
								Thank You!
							</h1>
							<p className="text-muted-foreground mb-6">
								Your attendance has been recorded successfully. You are now
								checked in for today&apos;s activities.
							</p>
							<p className="text-sm text-muted-foreground">Have a great day!</p>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6 pb-24">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Tech Attendance
					</h1>
					<div className="flex items-center gap-4 mb-4">
						<Badge variant="secondary" className="text-sm px-3 py-1">
							HackPSU Organizers
						</Badge>
						{techAttendanceFlag?.isEnabled ? (
							<Badge
								variant="default"
								className="text-sm px-2 py-1 bg-green-100 text-green-800"
							>
								Active
							</Badge>
						) : (
							<Badge variant="destructive" className="text-sm px-2 py-1">
								Disabled
							</Badge>
						)}
					</div>
					<p className="text-gray-600 leading-relaxed">
						Please confirm your attendance for today&apos;s activities. Your
						information has been pre-populated based on your account.
					</p>
				</div>

				{/* Form */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UserCheck className="h-5 w-5" />
							Attendance Check-In
						</CardTitle>
					</CardHeader>
					<CardContent>
						{!techAttendanceFlag?.isEnabled && (
							<div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-6">
								<div className="flex items-start gap-2">
									<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-medium text-red-800 dark:text-red-200">
											Attendance Submission Disabled
										</p>
										<p className="text-sm text-red-700 dark:text-red-300">
											The TechAttendance feature flag is currently disabled.
											Please contact an admin to enable attendance submission.
										</p>
									</div>
								</div>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Name */}
							<div className="space-y-2">
								<Label htmlFor="name">
									Full Name <span className="text-red-500">*</span>
								</Label>
								<Input
									id="name"
									type="text"
									placeholder="Enter your full name"
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									required
								/>
							</div>

							{/* Email */}
							<div className="space-y-2">
								<Label htmlFor="email">
									Email <span className="text-red-500">*</span>
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="Enter your email address"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									required
								/>
							</div>

							{/* Required Fields Notice */}
							<div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
								<div className="flex items-start gap-2">
									<AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-medium text-blue-800 dark:text-blue-200">
											Quick Check-In
										</p>
										<p className="text-sm text-blue-700 dark:text-blue-300">
											Your information has been pre-populated. Please verify
											it&apos;s correct and submit to record your attendance.
										</p>
									</div>
								</div>
							</div>

							{/* Honeypot field for spam prevention */}
							<input
								type="text"
								name="honeypot"
								className="sr-only"
								aria-hidden="true"
								tabIndex={-1}
								value={formData.honeypot}
								onChange={(e) => handleInputChange("honeypot", e.target.value)}
							/>

							{/* Submit Button */}
							<Button
								type="submit"
								size="lg"
								disabled={isSubmitting || !techAttendanceFlag?.isEnabled}
								className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50"
							>
								{isSubmitting ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
										Submitting...
									</>
								) : (
									<>
										<Send className="mr-2 h-4 w-4" />
										Submit Attendance
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Footer Message */}
				<div className="mt-8 text-center p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
					<p className="text-lg font-medium text-gray-900">
						Thank you for your dedication to HackPSU!
					</p>
					<p className="text-muted-foreground mt-2">
						Your attendance helps us track event participation.
					</p>
				</div>
			</div>
		</div>
	);
}
