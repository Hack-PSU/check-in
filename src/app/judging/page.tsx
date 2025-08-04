"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
	useAllScores,
	useAllProjects,
	useCreateScore,
	useUpdateScore,
	useAssignAdditonalJudging,
	type ScoreCreateEntity,
	type ScoreUpdateEntity,
} from "@/common/api/judging";
import { useFirebase } from "@/common/context";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";
import { useFlagState } from "@/common/api/flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

type CriteriaType =
	| "creativity"
	| "technical"
	| "implementation"
	| "clarity"
	| "growth"
	| "challenge1"
	| "challenge2"
	| "challenge3";

const criteriaLabels: Record<CriteriaType, string> = {
	creativity: "Creativity and Originality",
	technical: "Impact",
	implementation: "Implementation",
	clarity: "Clarity",
	growth: "Knowledge and Growth",
	challenge1: "Machine Learning",
	challenge2: "Entrepreneurship",
	challenge3: "10th Anniversary: Timeless Tech",
};

const criteriaDescriptions: Record<CriteriaType, string> = {
	creativity: "How original and innovative is the project?",
	technical: "What impact does this project have?",
	implementation: "How well is the project executed?",
	clarity: "How clear is the presentation and documentation?",
	growth: "How much learning and growth is demonstrated?",
	challenge1: "How well does it utilize machine learning?",
	challenge2: "What entrepreneurial value does it provide?",
	challenge3: "How does it leverage timeless technology?",
};

type Mode = "judging" | "history";

export default function JudgingPage() {
	const { user } = useFirebase();
	const [mode, setMode] = useState<Mode>("judging");
	const [assignedProjects, setAssignedProjects] = useState<number[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
		null
	);
	const [scoreValues, setScoreValues] = useState<ScoreUpdateEntity>({});
	const [notesMap, setNotesMap] = useState<Record<number, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: allProjects, isLoading: loadingProjects } = useAllProjects();
	const { data: allScores, isLoading: loadingScores } = useAllScores();
	const { data: hackathonData } = useActiveHackathonForStatic();
	const { mutate: createScoreMutate } = useCreateScore();
	const { mutate: updateScoreMutate } = useUpdateScore();
	const { mutate: assignAdditionalJudgingMutate } = useAssignAdditonalJudging();
	const { data: judgingFlag, isLoading: flagLoading } = useFlagState("judging");

	const [initialFetchDone, setInitialFetchDone] = useState(false);

	// Load notes from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem("judgingNotes");
			if (saved) {
				setNotesMap(JSON.parse(saved));
			}
		} catch (error) {
			console.error("Error loading notes from localStorage:", error);
		}
	}, []);

	// Set initial fetch done
	useEffect(() => {
		if (!loadingProjects && !loadingScores) {
			setInitialFetchDone(true);
		}
	}, [loadingProjects, loadingScores]);

	// Update assigned projects based on mode and scores
	useEffect(() => {
		if (
			!loadingProjects &&
			!loadingScores &&
			user?.uid &&
			allProjects &&
			allScores
		) {
			const filtered = allScores.filter(
				(s) =>
					s.judge?.id === user.uid &&
					(mode === "judging" ? !s.submitted : s.submitted)
			);
			const ids = Array.from(new Set(filtered.map((s) => s.project.id)));
			setAssignedProjects(ids);

			// Set first project as selected if none selected or current selection is not in the list
			if (!selectedProjectId || !ids.includes(selectedProjectId)) {
				setSelectedProjectId(ids[0] || null);
			}
		}
	}, [allScores, loadingScores, loadingProjects, user?.uid, mode, allProjects]);

	// Fetch additional assignments if needed
	useEffect(() => {
		if (
			initialFetchDone &&
			mode === "judging" &&
			!loadingProjects &&
			!loadingScores &&
			user?.uid &&
			assignedProjects.length === 0
		) {
			assignAdditionalJudgingMutate(user.uid, {
				onSuccess: () => toast.success("New assignments fetched."),
				onError: () => toast.error("Error fetching new assignments."),
			});
		}
	}, [
		initialFetchDone,
		mode,
		assignedProjects.length,
		loadingProjects,
		loadingScores,
		user?.uid,
		assignAdditionalJudgingMutate,
	]);

	// Load existing scores when project is selected
	useEffect(() => {
		if (selectedProjectId && allScores && user?.uid) {
			const existing = allScores.find(
				(s) => s.judge?.id === user.uid && s.project.id === selectedProjectId
			);
			setScoreValues({
				creativity: existing?.creativity ?? 0,
				technical: existing?.technical ?? 0,
				implementation: existing?.implementation ?? 0,
				clarity: existing?.clarity ?? 0,
				growth: existing?.growth ?? 0,
				challenge1: existing?.challenge1 ?? 0,
				challenge2: existing?.challenge2 ?? 0,
				challenge3: existing?.challenge3 ?? 0,
				submitted: existing?.submitted ?? false,
			});
		}
	}, [selectedProjectId, allScores, user?.uid]);

	const handleModeChange = (value: string) => setMode(value as Mode);

	const handleProjectChange = (value: string) => {
		const projectId = Number.parseInt(value);
		setSelectedProjectId(projectId);
	};

	const handleScoreChange = (criteria: CriteriaType, value: number[]) => {
		setScoreValues((prev) => ({ ...prev, [criteria]: value[0] }));
	};

	const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (selectedProjectId) {
			const updated = { ...notesMap, [selectedProjectId]: e.target.value };
			try {
				localStorage.setItem("judgingNotes", JSON.stringify(updated));
				setNotesMap(updated);
			} catch (error) {
				console.error("Error saving notes to localStorage:", error);
				toast.error("Failed to save notes");
			}
		}
	};

	const allCriteria: CriteriaType[] = [
		"creativity",
		"technical",
		"implementation",
		"clarity",
		"growth",
		"challenge1",
		"challenge2",
		"challenge3",
	];

	// Define track name to challenge mapping
	const trackToChallenge: Record<string, CriteriaType> = {
		"Machine Learning": "challenge1",
		Entrepreneurship: "challenge2",
		"10th Anniversary: Timeless Tech": "challenge3",
		"Timeless Tech": "challenge3", // Also accept shorter version
	};

	const getApplicableCriteria = () => {
		if (!selectedProjectId || !allProjects) return [];

		const baseCriteria: CriteriaType[] = [
			"creativity",
			"technical",
			"implementation",
			"clarity",
			"growth",
		];

		const proj = allProjects.find((p) => p.id === selectedProjectId);
		const categories = proj?.categories?.split(",").map((c) => c.trim()) || [];

		// Map tracks to their specific challenge criteria
		const challengeCriteria: CriteriaType[] = [];
		categories.forEach((category) => {
			const challengeType = trackToChallenge[category];
			if (challengeType && !challengeCriteria.includes(challengeType)) {
				challengeCriteria.push(challengeType);
			}
		});

		return [...baseCriteria, ...challengeCriteria];
	};

	const validateScores = () => {
		const applicableCriteria = getApplicableCriteria();
		return applicableCriteria.every(
			(c) => typeof scoreValues[c] === "number" && scoreValues[c] > 0
		);
	};

	const handleSubmit = async () => {
		if (!user?.uid || !selectedProjectId) return;

		if (!validateScores()) {
			toast.error(
				"Please score all applicable criteria with values greater than 0."
			);
			return;
		}

		setIsSubmitting(true);
		const payload = { ...scoreValues, submitted: true };
		const existing = allScores?.find(
			(s) => s.judge?.id === user.uid && s.project.id === selectedProjectId
		);

		const onSuccess = () => {
			toast.success("Scores submitted successfully.");
			setIsSubmitting(false);
		};

		const onError = (error: any) => {
			toast.error("Error submitting scores.");
			console.error("Submission error:", error);
			setIsSubmitting(false);
		};

		if (existing) {
			updateScoreMutate(
				{
					id: existing.judge.id,
					projectId: existing.project.id,
					data: payload,
				},
				{ onSuccess, onError }
			);
		} else {
			createScoreMutate(payload as ScoreCreateEntity, { onSuccess, onError });
		}
	};

	const handleProjectMissing = async () => {
		if (!user?.uid || !selectedProjectId) return;

		setIsSubmitting(true);
		const missing = allCriteria.reduce((acc, k) => ({ ...acc, [k]: 0 }), {
			submitted: true,
		} as any);
		const existing = allScores?.find(
			(s) => s.judge?.id === user.uid && s.project.id === selectedProjectId
		);

		const onSuccess = () => {
			toast.success("Missing project score submitted.");
			setIsSubmitting(false);
		};

		const onError = (error: any) => {
			toast.error("Error submitting missing project score.");
			console.error("Missing project error:", error);
			setIsSubmitting(false);
		};

		if (existing) {
			updateScoreMutate(
				{
					id: existing.judge.id,
					projectId: existing.project.id,
					data: missing,
				},
				{ onSuccess, onError }
			);
		} else {
			createScoreMutate(missing as ScoreCreateEntity, { onSuccess, onError });
		}
	};

	const selectedProject = selectedProjectId
		? allProjects?.find((p) => p.id === selectedProjectId)
		: null;
	const currentScore = selectedProjectId
		? allScores?.find(
				(s) => s.judge?.id === user?.uid && s.project.id === selectedProjectId
			)
		: null;

	if (flagLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
					<p>Loading judging status...</p>
				</div>
			</div>
		);
	}

	if (judgingFlag && !judgingFlag.isEnabled) {
		return (
			<div className="max-w-3xl mx-auto p-4">
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>The judging period has ended.</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<>
			<Toaster position="bottom-right" richColors />
			<div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Project Judging</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<Tabs value={mode} onValueChange={handleModeChange}>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="judging">Active Judging</TabsTrigger>
								<TabsTrigger value="history">Submitted Scores</TabsTrigger>
							</TabsList>

							<TabsContent value="judging" className="space-y-6">
								{loadingProjects || loadingScores ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-center">
											<Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
											<p>Loading projects and scores...</p>
										</div>
									</div>
								) : assignedProjects.length === 0 ? (
									<div className="text-center py-8">
										<p className="text-muted-foreground">
											Fetching new assignments...
										</p>
									</div>
								) : (
									<div className="space-y-6">
										{/* Project Selection */}
										<div className="space-y-2">
											<Label htmlFor="project-select">
												Select Project to Judge
											</Label>
											<Select
												value={selectedProjectId?.toString() || ""}
												onValueChange={handleProjectChange}
											>
												<SelectTrigger id="project-select">
													<SelectValue placeholder="Choose a project..." />
												</SelectTrigger>
												<SelectContent>
													{assignedProjects.map((pid) => {
														const proj = allProjects?.find((p) => p.id === pid);
														const score = allScores?.find(
															(s) =>
																s.judge?.id === user?.uid &&
																s.project.id === pid
														);
														return (
															<SelectItem key={pid} value={pid.toString()}>
																<div className="flex items-center gap-2">
																	<span>{proj?.name || `Project #${pid}`}</span>
																	{score?.submitted && (
																		<CheckCircle className="h-4 w-4 text-green-500" />
																	)}
																</div>
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</div>

										{selectedProject && (
											<Card>
												<CardHeader>
													<div className="flex items-center justify-between">
														<CardTitle className="text-lg">
															{selectedProject.name}
														</CardTitle>
														{currentScore?.submitted && (
															<Badge
																variant="secondary"
																className="flex items-center gap-1"
															>
																<CheckCircle className="h-3 w-3" />
																Submitted
															</Badge>
														)}
													</div>
													{selectedProject.categories && (
														<p className="text-sm text-muted-foreground">
															Categories: {selectedProject.categories}
														</p>
													)}
												</CardHeader>
												<CardContent className="space-y-6">
													{/* Scoring Criteria */}
													<div className="space-y-6">
														<h3 className="text-lg font-semibold">
															Scoring Criteria
														</h3>
														{getApplicableCriteria().map((criteria) => (
															<div key={criteria} className="space-y-3">
																<div className="space-y-1">
																	<div className="flex items-center justify-between">
																		<Label className="text-sm font-medium">
																			{criteriaLabels[criteria]}
																		</Label>
																		<Badge variant="outline">
																			{scoreValues[criteria] || 0}/5
																		</Badge>
																	</div>
																	<p className="text-xs text-muted-foreground">
																		{criteriaDescriptions[criteria]}
																	</p>
																</div>
																<Slider
																	value={[scoreValues[criteria] || 0]}
																	onValueChange={(v) =>
																		handleScoreChange(criteria, v)
																	}
																	max={5}
																	min={0}
																	step={1}
																	className="w-full"
																	disabled={mode === "history"}
																/>
																<div className="flex justify-between text-xs text-muted-foreground">
																	<span>0</span>
																	<span>1</span>
																	<span>2</span>
																	<span>3</span>
																	<span>4</span>
																	<span>5</span>
																</div>
															</div>
														))}
													</div>

													<Separator />

													{/* Notes Section */}
													<div className="space-y-2">
														<Label htmlFor="notes">
															Your Notes (saved locally)
														</Label>
														<Textarea
															id="notes"
															value={
																selectedProjectId !== null
																	? notesMap[selectedProjectId] || ""
																	: ""
															}
															onChange={handleNotesChange}
															rows={4}
															placeholder="Add your notes about this project..."
														/>
													</div>

													{/* Action Buttons */}
													<div className="flex gap-3">
														<Button
															onClick={handleSubmit}
															className="flex-1"
															disabled={isSubmitting || !validateScores()}
														>
															{isSubmitting
																? "Submitting..."
																: currentScore?.submitted
																	? "Update Submission"
																	: "Submit Scores"}
														</Button>
														<Button
															variant="outline"
															onClick={handleProjectMissing}
															disabled={isSubmitting}
														>
															Mark as Missing
														</Button>
													</div>
												</CardContent>
											</Card>
										)}
									</div>
								)}
							</TabsContent>

							<TabsContent value="history" className="space-y-6">
								{loadingProjects || loadingScores ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-center">
											<Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
											<p>Loading submitted scores...</p>
										</div>
									</div>
								) : assignedProjects.length === 0 ? (
									<div className="text-center py-8">
										<p className="text-muted-foreground">
											No submitted projects to display.
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{assignedProjects.map((pid) => {
											const proj = allProjects?.find((p) => p.id === pid);
											const score = allScores?.find(
												(s) => s.judge?.id === user?.uid && s.project.id === pid
											);
											const notes = notesMap[pid] || "";

											return (
												<Card key={pid}>
													<CardHeader>
														<div className="flex items-center justify-between">
															<CardTitle className="text-lg">
																{proj?.name || `Project #${pid}`}
															</CardTitle>
															<Badge
																variant="secondary"
																className="flex items-center gap-1 text-green-700"
															>
																<CheckCircle className="h-3 w-3" />
																Submitted
															</Badge>
														</div>
													</CardHeader>
													<CardContent className="space-y-4">
														<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
															{allCriteria.map((criteria) => {
																const value = score?.[criteria] || 0;
																return (
																	<div key={criteria} className="text-center">
																		<p className="text-sm font-medium">
																			{criteriaLabels[criteria]}
																		</p>
																		<p className="text-2xl font-bold text-primary">
																			{value}/5
																		</p>
																	</div>
																);
															})}
														</div>

														{notes && (
															<>
																<Separator />
																<div className="space-y-2">
																	<Label className="text-sm font-medium">
																		Your Notes
																	</Label>
																	<div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
																		{notes}
																	</div>
																</div>
															</>
														)}
													</CardContent>
												</Card>
											);
										})}
									</div>
								)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
