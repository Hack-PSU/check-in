"use client";

import React, { useEffect, useState } from "react";
import {
	Container,
	Typography,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Button,
	Snackbar,
	Alert,
	Box,
	Slider,
	Paper,
	Grid,
	TextField,
	Tabs,
	Tab,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

import {
	useAllScores,
	useAllProjects,
	useCreateScore,
	useUpdateScore,
	useAssignAdditonalJudging,
	ScoreCreateEntity,
	ScoreUpdateEntity,
} from "@/common/api/judging";
import { useFirebase } from "@/common/context";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";
import { useFlagState } from "@/common/api/flag";

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
	challenge3: "Timeless Tech",
};

type Mode = "judging" | "history";

const JudgingPage: React.FC = () => {
	const { user } = useFirebase();
	const [mode, setMode] = useState<Mode>("judging");
	const [assignedProjects, setAssignedProjects] = useState<number[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
	const [scoreValues, setScoreValues] = useState<ScoreUpdateEntity>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	} | null>(null);

	// State to store notes per project.
	const [notesMap, setNotesMap] = useState<{ [key: number]: string }>({});

	const { data: allProjects, isLoading: loadingProjects } = useAllProjects();
	const { data: allScores, isLoading: loadingScores } = useAllScores();
	const { data: hackathonData } = useActiveHackathonForStatic();

	const { mutate: createScoreMutate } = useCreateScore();
	const { mutate: updateScoreMutate } = useUpdateScore();
	const { mutate: assignAdditionalJudgingMutate } = useAssignAdditonalJudging();
	const { data: judgingFlag, isLoading: flagLoading } = useFlagState("judging");

	// Load saved notes from local storage.
	useEffect(() => {
		const savedNotes = localStorage.getItem("judgingNotes");
		if (savedNotes) {
			try {
				const parsed = JSON.parse(savedNotes);
				setNotesMap(parsed);
			} catch (error) {
				console.error("Error parsing saved notes", error);
			}
		}
	}, []);

	// Whenever the mode or score data changes, update the list of assigned projects.
	useEffect(() => {
		if (
			!loadingProjects &&
			!loadingScores &&
			user?.uid &&
			allProjects &&
			allScores
		) {
			const filteredScores = allScores.filter((score) => {
				// In Judging mode, show only unsubmitted projects.
				// In History mode, show only submitted projects.
				return (
					score.judge?.id === user.uid &&
					(mode === "judging" ? !score.submitted : score.submitted)
				);
			});
			const projectIds = Array.from(
				new Set(filteredScores.map((score) => score.project.id))
			);
			setAssignedProjects(projectIds);
			if (projectIds.length > 0) {
				setSelectedProjectId(projectIds[0]);
			} else {
				setSelectedProjectId("");
			}
		}
	}, [allScores, loadingScores, user?.uid, mode, allProjects, loadingProjects]);

	// When the selected project changes, load its score.
	useEffect(() => {
		if (selectedProjectId !== "" && !loadingScores && user?.uid && allScores) {
			const existingScore = allScores.find(
				(score) =>
					score.judge?.id === user.uid && score.project.id === selectedProjectId
			);
			setScoreValues({
				creativity: existingScore?.creativity ?? 0,
				technical: existingScore?.technical ?? 0,
				implementation: existingScore?.implementation ?? 0,
				clarity: existingScore?.clarity ?? 0,
				growth: existingScore?.growth ?? 0,
				challenge1: existingScore?.challenge1 ?? 0,
				challenge2: existingScore?.challenge2 ?? 0,
				challenge3: existingScore?.challenge3 ?? 0,
				submitted: existingScore?.submitted ?? false,
			});
		}
	}, [selectedProjectId, allScores, loadingScores, user?.uid]);

	const handleModeChange = (event: React.SyntheticEvent, newValue: Mode) => {
		setMode(newValue);
	};

	const handleProjectChange = (event: SelectChangeEvent<number>) => {
		setSelectedProjectId(event.target.value as number);
	};

	const handleScoreChange = (
		criteria: CriteriaType,
		value: number | number[]
	) => {
		setScoreValues((prev) => ({ ...prev, [criteria]: value as number }));
	};

	const handleSnackbarClose = () => {
		setSnackbar(null);
	};

	// Handle note field changes (notes remain editable in both modes).
	const handleNotesChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		if (selectedProjectId !== "") {
			const newNote = e.target.value;
			setNotesMap((prev) => {
				const updated = { ...prev, [selectedProjectId as number]: newNote };
				localStorage.setItem("judgingNotes", JSON.stringify(updated));
				return updated;
			});
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

	const validateScores = () =>
		allCriteria.every(
			(criteria) =>
				typeof scoreValues[criteria] === "number" && scoreValues[criteria]! >= 0
		);

	const handleSubmit = () => {
		if (!user?.uid || selectedProjectId === "") return;

		if (!validateScores()) {
			setSnackbar({
				open: true,
				message: "Please score all criteria before submitting.",
				severity: "error",
			});
			return;
		}

		// Prepare payload with submitted scores.
		const payload: ScoreCreateEntity | ScoreUpdateEntity = {
			...scoreValues,
			submitted: true,
		};

		const onSuccess = (message: string) => {
			setSnackbar({ open: true, message, severity: "success" });
			// Update local state to reflect submission.
			setScoreValues((prev) => ({ ...prev, submitted: true }));
		};

		const existingScore = allScores?.find(
			(score) =>
				score.judge?.id === user.uid && score.project.id === selectedProjectId
		);

		if (existingScore) {
			updateScoreMutate(
				{
					id: existingScore.judge.id,
					projectId: existingScore.project.id,
					data: payload as ScoreUpdateEntity,
				},
				{
					onSuccess: () => onSuccess("Scores submitted successfully."),
					onError: (err) => {
						console.error(err);
						setSnackbar({
							open: true,
							message: "Error updating scores.",
							severity: "error",
						});
					},
				}
			);
		} else {
			createScoreMutate(payload as ScoreCreateEntity, {
				onSuccess: () => onSuccess("Scores submitted successfully."),
				onError: (err) => {
					console.error(err);
					setSnackbar({
						open: true,
						message: "Error submitting scores.",
						severity: "error",
					});
				},
			});
		}
	};

	// Handle "Project Missing" action: submit a score of 1 for all fields.
	const handleProjectMissing = () => {
		if (!user?.uid || selectedProjectId === "") return;
		// Create a payload with 1 for every criteria.
		const missingPayload: ScoreUpdateEntity = allCriteria.reduce(
			(acc, key) => ({ ...acc, [key]: 1 }),
			{ submitted: true }
		);

		const onSuccess = (message: string) => {
			setSnackbar({ open: true, message, severity: "success" });
			setScoreValues(missingPayload);
		};

		const existingScore = allScores?.find(
			(score) =>
				score.judge?.id === user.uid && score.project.id === selectedProjectId
		);

		if (existingScore) {
			updateScoreMutate(
				{
					id: existingScore.judge.id,
					projectId: existingScore.project.id,
					data: missingPayload,
				},
				{
					onSuccess: () => onSuccess("Missing project score submitted."),
					onError: (err) => {
						console.error(err);
						setSnackbar({
							open: true,
							message: "Error updating missing project score.",
							severity: "error",
						});
					},
				}
			);
		} else {
			createScoreMutate(missingPayload as ScoreCreateEntity, {
				onSuccess: () => onSuccess("Missing project score submitted."),
				onError: (err) => {
					console.error(err);
					setSnackbar({
						open: true,
						message: "Error submitting missing project score.",
						severity: "error",
					});
				},
			});
		}
	};

	// Render criteria sliders. In History mode sliders are read-only.
	const renderCriteria = (readOnly: boolean) => {
		const selectedProject = allProjects?.find(
			(proj) => proj.id === selectedProjectId
		);
		const projectChallenges = selectedProject?.categories
			? selectedProject.categories.split(",").map((c: string) => c.trim())
			: [];

		return allCriteria
			.filter((criteria) => {
				if (criteria.startsWith("challenge")) {
					return projectChallenges.includes(criteria);
				}
				return true;
			})
			.map((criteria) => (
				<Box key={criteria} sx={{ mb: 4 }}>
					<Typography variant="h6">{criteriaLabels[criteria]}</Typography>
					<Slider
						value={scoreValues[criteria] ?? 0}
						onChange={(_, value) => handleScoreChange(criteria, value)}
						step={1}
						marks
						min={0}
						max={5}
						valueLabelDisplay="auto"
						disabled={readOnly}
					/>
				</Box>
			));
	};

	if (flagLoading) {
		return (
			<Container>
				<Typography align="center" sx={{ mt: 4 }}>
					Loading judging status...
				</Typography>
			</Container>
		);
	}

	if (judgingFlag && !judgingFlag.isEnabled) {
		return (
			<Container>
				<Alert severity="info" sx={{ mt: 4 }}>
					The judging period has ended. Please head over to the auditorium to
					discuss the projects.
				</Alert>
			</Container>
		);
	}

	return (
		<Container maxWidth="md" sx={{ mt: 4 }}>
			<Paper elevation={3} sx={{ p: 4 }}>
				{/* Mode Switch Tabs */}
				<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
					<Tabs
						value={mode}
						onChange={handleModeChange}
						indicatorColor="primary"
						textColor="primary"
					>
						<Tab label="Judging" value="judging" />
						<Tab label="History" value="history" />
					</Tabs>
				</Box>

				{loadingProjects || loadingScores ? (
					<Typography align="center">Loading data...</Typography>
				) : (
					<>
						{/* When no projects are available */}
						{assignedProjects.length === 0 && (
							<Box sx={{ textAlign: "center", mt: 4 }}>
								<Typography align="center">
									{mode === "judging"
										? "You have submitted all your projects."
										: "No submitted projects to display."}
								</Typography>
								{mode === "judging" && (
									<Button
										variant="outlined"
										sx={{ mt: 2 }}
										onClick={() => {
											if (user?.uid) {
												assignAdditionalJudgingMutate(user.uid, {
													onSuccess: () =>
														setSnackbar({
															open: true,
															message: "New assignments added.",
															severity: "success",
														}),
													onError: (err) => {
														console.error(err);
														setSnackbar({
															open: true,
															message: "Error getting new assignments.",
															severity: "error",
														});
													},
												});
											}
										}}
									>
										Get Additional Assignments
									</Button>
								)}
							</Box>
						)}

						{assignedProjects.length > 0 && (
							<>
								{/* Project Selector */}
								<FormControl fullWidth sx={{ mb: 4 }}>
									<InputLabel id="project-select-label">
										Select Project
									</InputLabel>
									<Select
										labelId="project-select-label"
										value={selectedProjectId}
										onChange={handleProjectChange}
										label="Select Project"
									>
										{assignedProjects.map((projectId) => {
											const project = allProjects?.find(
												(proj) => proj.id === projectId
											);
											const projectName =
												project?.name || `Project #${projectId}`;
											return (
												<MenuItem key={projectId} value={projectId}>
													{projectName}
												</MenuItem>
											);
										})}
									</Select>
								</FormControl>

								{selectedProjectId !== "" && (
									<>
										{/* Criteria Sliders */}
										{renderCriteria(mode === "history")}
										<Grid container spacing={2} sx={{ mt: 2 }}>
											{mode === "judging" && (
												<>
													<Grid item xs={12}>
														<Button
															variant="outlined"
															color="success"
															onClick={handleSubmit}
															fullWidth
															disabled={scoreValues.submitted}
														>
															{scoreValues.submitted ? "Submitted" : "Submit"}
														</Button>
													</Grid>
													<Grid item xs={12}>
														<Button
															variant="outlined"
															color="warning"
															onClick={handleProjectMissing}
															fullWidth
														>
															Project Missing
														</Button>
													</Grid>
												</>
											)}
										</Grid>

										{/* Note Area (editable in both modes) */}
										<Box sx={{ mt: 4 }}>
											<Typography variant="h6">
												Your Notes (saved locally)
											</Typography>
											<TextField
												fullWidth
												multiline
												rows={3}
												variant="outlined"
												value={notesMap[selectedProjectId as number] || ""}
												onChange={handleNotesChange}
												placeholder="Type your notes here..."
											/>
										</Box>
									</>
								)}
							</>
						)}
					</>
				)}
			</Paper>

			{snackbar && (
				<Snackbar
					open={snackbar.open}
					autoHideDuration={3000}
					onClose={handleSnackbarClose}
				>
					<Alert
						severity={snackbar.severity}
						onClose={handleSnackbarClose}
						sx={{ width: "100%" }}
					>
						{snackbar.message}
					</Alert>
				</Snackbar>
			)}
		</Container>
	);
};

export default JudgingPage;
