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
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Trophy, Users, CheckCircle, Star } from "lucide-react";
import {
	useAllProjects,
	useAllScores,
	ScoreEntity,
} from "@/common/api/judging";

export default function JudgingAnalyticsDashboard() {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState<string>("total");

	// Fetch data using provided hooks
	const { data: projects = [], isLoading: projectsLoading } = useAllProjects();
	const { data: scores = [], isLoading: scoresLoading } = useAllScores();

	const isLoading = projectsLoading || scoresLoading;

	// Helper function to calculate core score (excluding challenges)
	const calculateCoreScore = (score: ScoreEntity) => {
		return (
			(score.creativity || 0) +
			(score.technical || 0) +
			(score.implementation || 0) +
			(score.clarity || 0) +
			(score.growth || 0)
		);
	};

	// Analytics calculations
	const analytics = useMemo(() => {
		// Basic metrics
		const totalProjects = projects.length;
		const totalScores = scores.length;
		const submittedScores = scores.filter((score) => score.submitted).length;
		const pendingScores = totalScores - submittedScores;

		// Judge metrics
		const uniqueJudges = new Set(
			scores.map((score) => score.judge?.id).filter(Boolean)
		).size;
		const judgesWithSubmissions = new Set(
			scores
				.filter((score) => score.submitted)
				.map((score) => score.judge?.id)
				.filter(Boolean)
		).size;

		// Project scoring status
		const projectsWithScores = new Set(
			scores.map((score) => score.project?.id).filter(Boolean)
		).size;
		const projectsWithoutScores = totalProjects - projectsWithScores;

		// Score averages by category (excluding challenges)
		const submittedScoreData = scores.filter((score) => score.submitted);
		const categoryAverages = {
			creativity:
				submittedScoreData.reduce((sum, s) => sum + (s.creativity || 0), 0) /
					submittedScoreData.length || 0,
			technical:
				submittedScoreData.reduce((sum, s) => sum + (s.technical || 0), 0) /
					submittedScoreData.length || 0,
			implementation:
				submittedScoreData.reduce(
					(sum, s) => sum + (s.implementation || 0),
					0
				) / submittedScoreData.length || 0,
			clarity:
				submittedScoreData.reduce((sum, s) => sum + (s.clarity || 0), 0) /
					submittedScoreData.length || 0,
			growth:
				submittedScoreData.reduce((sum, s) => sum + (s.growth || 0), 0) /
					submittedScoreData.length || 0,
			challenge1:
				submittedScoreData.reduce((sum, s) => sum + (s.challenge1 || 0), 0) /
					submittedScoreData.length || 0,
			challenge2:
				submittedScoreData.reduce((sum, s) => sum + (s.challenge2 || 0), 0) /
					submittedScoreData.length || 0,
			challenge3:
				submittedScoreData.reduce((sum, s) => sum + (s.challenge3 || 0), 0) /
					submittedScoreData.length || 0,
		};

		// Project analysis with scores
		const projectAnalysis = projects.map((project) => {
			const projectScores = scores.filter(
				(score) => score.project?.id === project.id
			);
			const submittedProjectScores = projectScores.filter(
				(score) => score.submitted
			);

			// Calculate average total - excluding challenges
			let averageTotal = 0;
			if (submittedProjectScores.length > 0) {
				const coreScores = submittedProjectScores.map((score) =>
					calculateCoreScore(score)
				);
				averageTotal =
					coreScores.reduce((sum, total) => sum + total, 0) / coreScores.length;
			}

			const categoryAverages = {
				creativity:
					submittedProjectScores.reduce(
						(sum, s) => sum + (s.creativity || 0),
						0
					) / submittedProjectScores.length || 0,
				technical:
					submittedProjectScores.reduce(
						(sum, s) => sum + (s.technical || 0),
						0
					) / submittedProjectScores.length || 0,
				implementation:
					submittedProjectScores.reduce(
						(sum, s) => sum + (s.implementation || 0),
						0
					) / submittedProjectScores.length || 0,
				clarity:
					submittedProjectScores.reduce((sum, s) => sum + (s.clarity || 0), 0) /
						submittedProjectScores.length || 0,
				growth:
					submittedProjectScores.reduce((sum, s) => sum + (s.growth || 0), 0) /
						submittedProjectScores.length || 0,
				challenge1:
					submittedProjectScores.reduce(
						(sum, s) => sum + (s.challenge1 || 0),
						0
					) / submittedProjectScores.length || 0,
				challenge2:
					submittedProjectScores.reduce(
						(sum, s) => sum + (s.challenge2 || 0),
						0
					) / submittedProjectScores.length || 0,
				challenge3:
					submittedProjectScores.reduce(
						(sum, s) => sum + (s.challenge3 || 0),
						0
					) / submittedProjectScores.length || 0,
			};

			return {
				...project,
				totalScores: projectScores.length,
				submittedScores: submittedProjectScores.length,
				pendingScores: projectScores.length - submittedProjectScores.length,
				averageTotal,
				categoryAverages,
				scores: projectScores,
				completionRate:
					projectScores.length > 0
						? (submittedProjectScores.length / projectScores.length) * 100
						: 0,
			};
		});

		// Judge analysis
		const judgeAnalysis = Array.from(
			new Set(scores.map((score) => score.judge?.id).filter(Boolean))
		).map((judgeId) => {
			const judgeScores = scores.filter((score) => score.judge?.id === judgeId);
			const judge = judgeScores[0]?.judge;
			const submittedJudgeScores = judgeScores.filter(
				(score) => score.submitted
			);

			// Calculate average score for judge (excluding challenges)
			let averageScore = 0;
			if (submittedJudgeScores.length > 0) {
				const coreScores = submittedJudgeScores.map((score) =>
					calculateCoreScore(score)
				);
				averageScore =
					coreScores.reduce((sum, total) => sum + total, 0) / coreScores.length;
			}

			return {
				id: judgeId,
				name: `${judge?.firstName || ""} ${judge?.lastName || ""}`.trim(),
				email: judge?.email || "",
				totalAssigned: judgeScores.length,
				submitted: submittedJudgeScores.length,
				pending: judgeScores.length - submittedJudgeScores.length,
				completionRate:
					judgeScores.length > 0
						? (submittedJudgeScores.length / judgeScores.length) * 100
						: 0,
				averageScore,
				scores: judgeScores,
			};
		});

		// Filter and sort project analysis
		const filteredProjects = projectAnalysis.filter((project) =>
			project.name.toLowerCase().includes(searchTerm.toLowerCase())
		);

		// Sort projects
		filteredProjects.sort((a, b) => {
			switch (sortBy) {
				case "total":
					return b.averageTotal - a.averageTotal;
				case "name":
					return a.name.localeCompare(b.name);
				case "creativity":
					return b.categoryAverages.creativity - a.categoryAverages.creativity;
				case "technical":
					return b.categoryAverages.technical - a.categoryAverages.technical;
				case "implementation":
					return (
						b.categoryAverages.implementation -
						a.categoryAverages.implementation
					);
				case "clarity":
					return b.categoryAverages.clarity - a.categoryAverages.clarity;
				case "growth":
					return b.categoryAverages.growth - a.categoryAverages.growth;
				case "challenge1":
					return b.categoryAverages.challenge1 - a.categoryAverages.challenge1;
				case "challenge2":
					return b.categoryAverages.challenge2 - a.categoryAverages.challenge2;
				case "challenge3":
					return b.categoryAverages.challenge3 - a.categoryAverages.challenge3;
				default:
					return b.averageTotal - a.averageTotal;
			}
		});

		// Filter and sort judge analysis
		const filteredJudges = judgeAnalysis
			.filter((judge) =>
				judge.name.toLowerCase().includes(searchTerm.toLowerCase())
			)
			.sort((a, b) => b.completionRate - a.completionRate);

		// Core category averages (excluding challenges)
		const coreCategories = [
			categoryAverages.creativity,
			categoryAverages.technical,
			categoryAverages.implementation,
			categoryAverages.clarity,
			categoryAverages.growth,
		].filter((avg) => avg > 0);

		const coreAverageScore =
			coreCategories.length > 0
				? coreCategories.reduce((sum, avg) => sum + avg, 0) /
					coreCategories.length
				: 0;

		return {
			totalProjects,
			totalScores,
			submittedScores,
			pendingScores,
			uniqueJudges,
			judgesWithSubmissions,
			projectsWithScores,
			projectsWithoutScores,
			categoryAverages,
			projectAnalysis: filteredProjects,
			judgeAnalysis: filteredJudges,
			completionRate:
				totalScores > 0 ? (submittedScores / totalScores) * 100 : 0,
			coreAverageScore,
		};
	}, [projects, scores, searchTerm, sortBy]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading judging analytics...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Judging Analytics
						</h1>
						<p className="text-gray-600 mt-1">
							Monitor project scoring and judge activity
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="total">Total Score</SelectItem>
								<SelectItem value="name">Project Name</SelectItem>
								<SelectItem value="creativity">Creativity</SelectItem>
								<SelectItem value="technical">Technical</SelectItem>
								<SelectItem value="implementation">Implementation</SelectItem>
								<SelectItem value="clarity">Clarity</SelectItem>
								<SelectItem value="growth">Growth</SelectItem>
								<SelectItem value="challenge1">Machine Learning</SelectItem>
								<SelectItem value="challenge2">Entrepreneurship</SelectItem>
								<SelectItem value="challenge3">10th Anniversary: Timeless Tech</SelectItem>
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

				{/* Key Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Projects
							</CardTitle>
							<Trophy className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.totalProjects}
							</div>
							<p className="text-xs text-muted-foreground">
								{analytics.projectsWithScores} with scores,{" "}
								{analytics.projectsWithoutScores} unscored
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Score Submissions
							</CardTitle>
							<CheckCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.submittedScores}
							</div>
							<p className="text-xs text-muted-foreground">
								{analytics.pendingScores} pending (
								{analytics.completionRate.toFixed(1)}% complete)
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Active Judges
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.judgesWithSubmissions}
							</div>
							<p className="text-xs text-muted-foreground">
								of {analytics.uniqueJudges} assigned judges
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Avg Core Score
							</CardTitle>
							<Star className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.coreAverageScore.toFixed(1)}
							</div>
							<p className="text-xs text-muted-foreground">
								excluding challenge scores
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Category Averages - Compact Numbers */}
				<Card>
					<CardHeader>
						<CardTitle>Category Averages</CardTitle>
						<CardDescription>
							Average scores across all submitted evaluations
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
							{Object.entries(analytics.categoryAverages).map(
								([category, average]) => {
									if (average === 0) return null;
									return (
										<div
											key={category}
											className="text-center p-3 bg-gray-50 rounded-lg"
										>
											<div className="text-xl font-bold text-blue-600">
												{average.toFixed(1)}
											</div>
											<div className="text-xs text-gray-600 capitalize">
												{category.replace(/([A-Z])/g, " $1").trim()}
											</div>
										</div>
									);
								}
							)}
						</div>
					</CardContent>
				</Card>

				{/* Tabs for Projects and Judges */}
				<Tabs defaultValue="projects" className="space-y-6">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="projects">Projects</TabsTrigger>
						<TabsTrigger value="judges">Judges</TabsTrigger>
					</TabsList>

					{/* Projects Tab */}
					<TabsContent value="projects" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Project Scoring Analysis</CardTitle>
								<CardDescription>
									Detailed breakdown of project scores and judge evaluations
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics.projectAnalysis.map((project, index) => (
										<div
											key={project.id}
											className="border rounded-lg p-4 space-y-3"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="text-lg font-semibold text-gray-400">
														#{index + 1}
													</div>
													<div>
														<h3 className="font-semibold text-lg">
															{project.name}
														</h3>
														<div className="flex items-center gap-4 text-sm text-gray-600">
															{project.categories && (
																<Badge variant="outline">
																	{project.categories}
																</Badge>
															)}
															<span>
																{project.submittedScores} submitted scores
															</span>
															{project.pendingScores > 0 && (
																<span className="text-orange-600">
																	{project.pendingScores} pending
																</span>
															)}
															{project.completionRate < 100 && (
																<div className="flex items-center gap-1">
																	<Progress
																		value={project.completionRate}
																		className="h-1 w-12"
																	/>
																	<span className="text-xs">
																		{project.completionRate.toFixed(0)}%
																	</span>
																</div>
															)}
														</div>
													</div>
												</div>
												<div className="text-right">
													<div className="text-2xl font-bold">
														{project.averageTotal > 0
															? project.averageTotal.toFixed(1)
															: "—"}
													</div>
													<div className="text-sm text-gray-500">
														avg core score
													</div>
												</div>
											</div>

											{/* Category Scores - Compact */}
											{project.submittedScores > 0 && (
												<div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
													{Object.entries(project.categoryAverages).map(
														([category, score]) => {
															if (score === 0) return null;
															return (
																<div
																	key={category}
																	className="text-center p-1 bg-gray-50 rounded"
																>
																	<div className="font-semibold">
																		{score.toFixed(1)}
																	</div>
																	<div className="text-gray-500 capitalize text-[10px]">
																		{category.replace(/([A-Z])/g, " $1").trim()}
																	</div>
																</div>
															);
														}
													)}
												</div>
											)}

											{/* Individual Judge Scores - Nested Accordion */}
											{project.scores.length > 0 && (
												<Accordion type="single" collapsible className="w-full">
													<AccordionItem value="judge-scores">
														<AccordionTrigger className="hover:no-underline py-2">
															<div className="flex items-center gap-2">
																<span className="font-medium text-sm text-gray-700">
																	Judge Scores
																</span>
																<Badge variant="outline" className="text-xs">
																	{project.scores.length} judges
																</Badge>
															</div>
														</AccordionTrigger>
														<AccordionContent>
															<div className="space-y-2 pt-2">
																<Accordion type="multiple" className="w-full">
																	{project.scores.map((score, scoreIndex) => {
																		const judgeName =
																			`${score.judge?.firstName || ""} ${score.judge?.lastName || ""}`.trim() ||
																			"Unknown Judge";
																		const coreScore = calculateCoreScore(score);
																		// Use score.id if available, otherwise use a combination of project.id and scoreIndex
																		const accordionValue = score.id
																			? score.id.toString()
																			: `${project.id}-${scoreIndex}`;

																		return (
																			<AccordionItem
																				key={accordionValue}
																				value={accordionValue}
																			>
																				<AccordionTrigger className="hover:no-underline">
																					<div className="flex items-center justify-between w-full pr-4">
																						<span
																							className={
																								score.submitted
																									? "font-medium"
																									: "text-gray-500"
																							}
																						>
																							{judgeName}
																						</span>
																						<span className="font-semibold">
																							{score.submitted && coreScore > 0
																								? coreScore.toFixed(1)
																								: "—"}
																						</span>
																					</div>
																				</AccordionTrigger>
																				<AccordionContent>
																					{score.submitted ? (
																						<div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
																							{score.creativity !== undefined &&
																								score.creativity > 0 && (
																									<div className="flex justify-between p-2 bg-gray-50 rounded">
																										<span className="text-sm">
																											Creativity:
																										</span>
																										<span className="font-medium">
																											{score.creativity}
																										</span>
																									</div>
																								)}
																							{score.technical !== undefined &&
																								score.technical > 0 && (
																									<div className="flex justify-between p-2 bg-gray-50 rounded">
																										<span className="text-sm">
																											Technical:
																										</span>
																										<span className="font-medium">
																											{score.technical}
																										</span>
																									</div>
																								)}
																							{score.implementation !==
																								undefined &&
																								score.implementation > 0 && (
																									<div className="flex justify-between p-2 bg-gray-50 rounded">
																										<span className="text-sm">
																											Implementation:
																										</span>
																										<span className="font-medium">
																											{score.implementation}
																										</span>
																									</div>
																								)}
																							{score.clarity !== undefined &&
																								score.clarity > 0 && (
																									<div className="flex justify-between p-2 bg-gray-50 rounded">
																										<span className="text-sm">
																											Clarity:
																										</span>
																										<span className="font-medium">
																											{score.clarity}
																										</span>
																									</div>
																								)}
																							{score.growth !== undefined &&
																								score.growth > 0 && (
																									<div className="flex justify-between p-2 bg-gray-50 rounded">
																										<span className="text-sm">
																											Growth:
																										</span>
																										<span className="font-medium">
																											{score.growth}
																										</span>
																									</div>
																								)}
																							{score.challenge1 !== undefined &&
																								score.challenge1 > 0 && (
																									<div className="flex justify-between p-2 bg-blue-50 rounded">
																										<span className="text-sm">
																											Machine Learning:
																										</span>
																										<span className="font-medium">
																											{score.challenge1}
																										</span>
																									</div>
																								)}
																							{score.challenge2 !== undefined &&
																								score.challenge2 > 0 && (
																									<div className="flex justify-between p-2 bg-blue-50 rounded">
																										<span className="text-sm">
																											Entrepreneurship:
																										</span>
																										<span className="font-medium">
																											{score.challenge2}
																										</span>
																									</div>
																								)}
																							{score.challenge3 !== undefined &&
																								score.challenge3 > 0 && (
																									<div className="flex justify-between p-2 bg-blue-50 rounded">
																										<span className="text-sm">
																											10th Anniversary: Timeless Tech:
																										</span>
																										<span className="font-medium">
																											{score.challenge3}
																										</span>
																									</div>
																								)}
																						</div>
																					) : (
																						<div className="text-sm text-gray-500 pt-2">
																							Score not yet submitted
																						</div>
																					)}
																				</AccordionContent>
																			</AccordionItem>
																		);
																	})}
																</Accordion>
															</div>
														</AccordionContent>
													</AccordionItem>
												</Accordion>
											)}
										</div>
									))}

									{analytics.projectAnalysis.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											No projects found matching your search
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Judges Tab */}
					<TabsContent value="judges" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Judge Activity Analysis</CardTitle>
								<CardDescription>
									Judge performance and scoring activity
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics.judgeAnalysis.map((judge, index) => (
										<div
											key={judge.id}
											className="flex items-center justify-between p-4 border rounded-lg"
										>
											<div className="flex items-center gap-3 flex-1">
												<div className="text-lg font-semibold text-gray-400 w-8">
													#{index + 1}
												</div>
												<div className="flex-1">
													<h3 className="font-semibold">{judge.name}</h3>
													<div className="text-sm text-gray-600 mb-2">
														{judge.email}
													</div>

													<div className="flex items-center gap-4 text-sm">
														<span>
															{judge.submitted}/{judge.totalAssigned} (
															{judge.completionRate.toFixed(0)}%)
														</span>
														<Progress
															value={judge.completionRate}
															className="h-1 w-20"
														/>
														{judge.pending > 0 && (
															<span className="text-orange-600">
																{judge.pending} pending
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="text-right ml-4">
												<div className="text-2xl font-bold">
													{judge.submitted}
												</div>
												<div className="text-sm text-gray-500">submitted</div>
												{judge.averageScore > 0 && (
													<div className="text-xs text-gray-400">
														avg: {judge.averageScore.toFixed(1)}
													</div>
												)}
											</div>
										</div>
									))}

									{analytics.judgeAnalysis.length === 0 && (
										<div className="text-center py-8 text-gray-500">
											No judges found
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
