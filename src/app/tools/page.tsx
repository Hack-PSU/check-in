"use client";

import type React from "react";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
	Upload,
	Download,
	Users,
	FileSpreadsheet,
	AlertTriangle,
	CheckCircle,
	Zap,
	Loader2,
	ExternalLink,
	Globe,
	DollarSign,
	Mail,
	Shield,
	Activity,
	Lock,
	MessagesSquareIcon,
} from "lucide-react";
import { useUploadProjectsCsv } from "@/common/api/judging/hook";
import { useAllResumes } from "@/common/api/user/hook";
import { useAllUsers } from "@/common/api/user/hook";
import { useAllRegistrations } from "@/common/api/registration/hook";

const quickLinks = [
	{
		name: "Main Website",
		url: "https://hackpsu.org",
		icon: Globe,
		description: "HackPSU main website",
	},
	{
		name: "Finance Dashboard",
		url: "https://finance.hackpsu.org",
		icon: DollarSign,
		description: "Financial management system",
	},
	{
		name: "Email System",
		url: "https://emails.hackpsu.org",
		icon: Mail,
		description: "Email management platform",
	},
	{
		name: "Admin Panel",
		url: "https://admin.hackpsu.org",
		icon: Shield,
		description: "Administrative controls",
	},
	{
		name: "Status Monitor",
		url: "https://status.hackpsu.org",
		icon: Activity,
		description: "System status monitoring",
	},
	{
		name: "Vaultwarden",
		url: "https://vaultwarden.hackpsu.org",
		icon: Lock,
		description: "Password management",
	},
	{
		name: "Organizer Chat",
		url: "/peerjs",
		icon: MessagesSquareIcon,
		description: "Real-time chat for organizers",
	},
];

export default function EventOperations() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);

	const uploadProjectsCsv = useUploadProjectsCsv();
	const {
		data: resumesBlob,
		isLoading: resumesLoading,
		refetch: fetchResumes,
		isError: resumesError,
	} = useAllResumes();

	const {
		data: registrations,
		isLoading: regsLoading,
		isError: regsError,
	} = useAllRegistrations(false);

	const {
		data: users,
		isLoading: usersLoading,
		isError: usersError,
	} = useAllUsers();

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
				toast.error("Please select a CSV file");
				return;
			}
			setSelectedFile(file);
			toast.success(`Selected: ${file.name}`);
		}
	};

	const handleUploadProjects = async () => {
		if (!selectedFile) {
			toast.error("Please select a CSV file first");
			return;
		}

		try {
			setUploadProgress(10);
			const result = await uploadProjectsCsv.mutateAsync(selectedFile);
			setUploadProgress(100);

			toast.success(`Successfully uploaded ${result.length} projects!`);
			setSelectedFile(null);
			setUploadProgress(0);

			// Reset file input
			const fileInput = document.getElementById(
				"csv-upload"
			) as HTMLInputElement;
			if (fileInput) fileInput.value = "";
		} catch (error) {
			setUploadProgress(0);
			toast.error(
				error instanceof Error ? error.message : "Failed to upload projects"
			);
		}
	};

	const handleDownloadResumes = async () => {
		try {
			toast.info("Preparing resumes download...");

			const result = await fetchResumes();

			if (!result.data) {
				toast.error("No resume data received");
				return;
			}

			// Create blob URL and download
			const blob = new Blob([result.data], { type: "application/zip" });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `hackathon-resumes-${new Date().toISOString().split("T")[0]}.zip`;
			link.style.display = "none";

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.success("Resumes downloaded successfully!");
		} catch (error) {
			console.error("Download error:", error);
			toast.error("Failed to download resumes. Please try again.");
		}
	};

	const handleDownloadAttendees = () => {
		if (!registrations || !users) return;

		const rows = registrations
			.map((r) => {
				const u = users.find((u) => u.id === r.userId);
				return u
					? { email: u.email, firstName: u.firstName, lastName: u.lastName }
					: null;
			})
			.filter((x): x is NonNullable<typeof x> => !!x);

		if (!rows.length) {
			toast.error("No attendees found");
			return;
		}

		const header = ["email", "firstName", "lastName"];
		const csv = [
			header.join(","),
			...rows.map((r) =>
				[r.email, r.firstName, r.lastName]
					.map((cell) => `"${cell.replace(/"/g, '""')}"`)
					.join(",")
			),
		].join("\n");

		const blob = new Blob([csv], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `attendees-${new Date().toISOString().split("T")[0]}.csv`;
		link.style.display = "none";

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<div className="flex items-center justify-center gap-2 mb-2">
					<Zap className="h-8 w-8 text-primary" />
					<h1 className="text-3xl font-bold tracking-tight">
						Event Operations Center
					</h1>
				</div>
				<p className="text-muted-foreground">
					Critical tools and functions for hackathon day operations
				</p>
			</div>

			<Tabs defaultValue="tools" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="tools" className="flex items-center gap-2">
						<Zap className="h-4 w-4" />
						Quick Links
					</TabsTrigger>
					<TabsTrigger value="projects" className="flex items-center gap-2">
						<FileSpreadsheet className="h-4 w-4" />
						Projects Upload
					</TabsTrigger>
					<TabsTrigger value="resumes" className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						Resume Download
					</TabsTrigger>
					<TabsTrigger value="attendees" className="flex items-center gap-2">
						<Download className="h-4 w-4" />
						Attendees CSV
					</TabsTrigger>
				</TabsList>

				{/* Projects Upload Tab */}
				<TabsContent value="projects" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Upload className="h-5 w-5" />
								Upload Projects CSV
							</CardTitle>
							<CardDescription>
								Upload the projects CSV file to populate the judging system.
								This should be done before judging begins.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* File Upload Area */}
							<div className="space-y-4">
								<div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
									<FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<div className="space-y-2">
										<h3 className="text-lg font-medium">
											Select Projects CSV File
										</h3>
										<p className="text-sm text-muted-foreground">
											Choose the CSV file containing all hackathon project
											submissions
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										className="mt-4 bg-transparent"
										onClick={() =>
											document.getElementById("csv-upload")?.click()
										}
									>
										Choose CSV File
									</Button>
									<input
										id="csv-upload"
										type="file"
										accept=".csv"
										className="hidden"
										onChange={handleFileSelect}
									/>
								</div>

								{selectedFile && (
									<Alert>
										<CheckCircle className="h-4 w-4" />
										<AlertDescription>
											<strong>Selected:</strong> {selectedFile.name} (
											{(selectedFile.size / 1024).toFixed(1)} KB)
										</AlertDescription>
									</Alert>
								)}

								{uploadProgress > 0 && uploadProgress < 100 && (
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Uploading...</span>
											<span>{uploadProgress}%</span>
										</div>
										<Progress value={uploadProgress} />
									</div>
								)}
							</div>

							<Separator />

							{/* Upload Button */}
							<div className="flex justify-between items-center">
								<div className="space-y-1">
									<p className="text-sm font-medium">Ready to upload?</p>
									<p className="text-xs text-muted-foreground">
										This will replace any existing projects in the system
									</p>
								</div>
								<Button
									onClick={handleUploadProjects}
									disabled={!selectedFile || uploadProjectsCsv.isPending}
									size="lg"
								>
									{uploadProjectsCsv.isPending ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload className="h-4 w-4 mr-2" />
											Upload Projects
										</>
									)}
								</Button>
							</div>

							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									<strong>Important:</strong> Make sure your CSV file includes
									all required columns: project name, team members, description,
									and any other judging criteria fields.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Resume Download Tab */}
				<TabsContent value="resumes" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Download className="h-5 w-5" />
								Download All Resumes
							</CardTitle>
							<CardDescription>
								Download a ZIP file containing all participant resumes for
								sponsors and recruiters.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="text-center space-y-4">
								<div className="p-8 border rounded-lg bg-muted/20">
									<Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-xl font-semibold mb-2">
										Participant Resumes
									</h3>
									<p className="text-muted-foreground mb-6">
										Download all submitted resumes in a single ZIP file for easy
										distribution to sponsors.
									</p>

									<Button
										onClick={handleDownloadResumes}
										disabled={resumesLoading}
										size="lg"
										className="w-full sm:w-auto"
										variant={resumesError ? "destructive" : "default"}
									>
										{resumesLoading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Preparing Download...
											</>
										) : resumesError ? (
											<>
												<AlertTriangle className="h-4 w-4 mr-2" />
												Retry Download
											</>
										) : (
											<>
												<Download className="h-4 w-4 mr-2" />
												Download All Resumes
											</>
										)}
									</Button>
								</div>
							</div>

							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									<strong>Privacy Notice:</strong> Only download resumes when
									necessary and ensure they are shared responsibly with
									authorized sponsors and recruiters only.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Attendees CSV Tab */}
				<TabsContent value="attendees" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Download className="h-5 w-5" />
								Download Attendees CSV
							</CardTitle>
							<CardDescription>
								Export registered users’ email, first name & last name.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{regsLoading || usersLoading ? (
								<div className="flex items-center gap-2">
									<Loader2 className="animate-spin h-4 w-4" />
									<span>Loading…</span>
								</div>
							) : regsError || usersError ? (
								<Alert>
									<AlertTriangle className="h-4 w-4" />
									<AlertDescription>
										Failed to load data. Please try again.
									</AlertDescription>
								</Alert>
							) : (
								<Button onClick={handleDownloadAttendees} size="lg">
									<Download className="h-4 w-4 mr-2" />
									Download CSV
								</Button>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Quick Links Tab */}
				<TabsContent value="tools" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Zap className="h-5 w-5" />
								Quick Links
							</CardTitle>
							<CardDescription>
								Access all HackPSU systems and platforms
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{quickLinks.map((link) => {
									const Icon = link.icon;
									return (
										<Button
											key={link.name}
											variant="outline"
											className="h-auto p-4 flex flex-col items-start gap-2 bg-transparent hover:bg-accent"
											asChild
										>
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
											>
												<div className="flex items-center gap-2 w-full">
													<Icon className="h-5 w-5 text-primary" />
													<span className="font-medium">{link.name}</span>
													<ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
												</div>
												<p className="text-xs text-muted-foreground text-left">
													{link.description}
												</p>
											</a>
										</Button>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
