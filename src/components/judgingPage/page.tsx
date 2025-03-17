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
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

import {
	useAllScores,
	useAllProjects,
	useCreateScore,
	useUpdateScore,
	useAssignAdditonalJudging, // new hook import
	ScoreCreateEntity,
	ScoreUpdateEntity,
} from "@/common/api/judging";
import { useFirebase } from "@/components/context";
import { useActiveHackathonForStatic } from "@/common/api/hackathon";

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

const JudgingPage: React.FC = () => {
	const { user } = useFirebase();
	const [assignedProjects, setAssignedProjects] = useState<number[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
	const [scoreValues, setScoreValues] = useState<ScoreUpdateEntity>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	} | null>(null);

	const { data: allProjects, isLoading: loadingProjects } = useAllProjects();
	const { data: allScores, isLoading: loadingScores } = useAllScores();
	const { data: hackathonData } = useActiveHackathonForStatic();

	const { mutate: createScoreMutate } = useCreateScore();
	const { mutate: updateScoreMutate } = useUpdateScore();
	const { mutate: assignAdditionalJudgingMutate } = useAssignAdditonalJudging(); // new mutation hook

	// Initialize assigned projects: only include those that are not yet submitted.
	useEffect(() => {
		if (
			!loadingProjects &&
			!loadingScores &&
			user?.uid &&
			allProjects &&
			allScores
		) {
			const judgeScores = allScores.filter(
				(score) => score.judge?.id === user.uid && !score.submitted
			);
			const projectIds = Array.from(
				new Set(judgeScores.map((score) => score.project.id))
			);
			setAssignedProjects(projectIds);
			if (projectIds.length > 0) {
				setSelectedProjectId(projectIds[0]);
			} else {
				setSelectedProjectId("");
			}
		}
	}, [user, allProjects, allScores, loadingProjects, loadingScores]);

	// Load the current score (or initialize with defaults) when the selected project changes.
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
			// Remove the submitted project from the list.
			const newProjects = assignedProjects.filter(
				(id) => id !== selectedProjectId
			);
			setAssignedProjects(newProjects);
			// If there are any remaining projects, select the first one.
			if (newProjects.length > 0) {
				setSelectedProjectId(newProjects[0]);
			} else {
				setSelectedProjectId("");
			}
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
					onSuccess: () => onSuccess("Scores updated successfully."),
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

	// Render criteria sliders.
	// For criteria starting with "challenge", only show the slider if the selected project's
	// categories include that specific challenge.
	const renderCriteria = () => {
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
						valueLabelDisplay="on"
					/>
				</Box>
			));
	};

	return (
		<Container maxWidth="md" sx={{ mt: 4 }}>
			<Paper elevation={3} sx={{ p: 4 }}>
				<Typography variant="h4" gutterBottom align="center">
					Project Judging
				</Typography>

				{(loadingProjects || loadingScores) && (
					<Typography align="center">Loading data...</Typography>
				)}

				{/* If there are no unsubmitted projects, show a completion message with a button to get additional assignments */}
				{!loadingProjects &&
					!loadingScores &&
					assignedProjects.length === 0 && (
						<Box sx={{ textAlign: "center", mt: 4 }}>
							<Typography align="center">
								You have submitted all your projects.
							</Typography>
							<Button
								variant="outlined"
								sx={{ mt: 2 }}
								onClick={() => {
									if (user?.uid) {
										assignAdditionalJudgingMutate(user.uid);
									}
								}}
							>
								Get Additional Assignments
							</Button>
						</Box>
					)}

				{assignedProjects.length > 0 && (
					<>
						<FormControl fullWidth sx={{ mb: 4 }}>
							<InputLabel id="project-select-label">Select Project</InputLabel>
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
									const projectName = project?.name || `Project #${projectId}`;
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
								{renderCriteria()}
								<Grid container spacing={2} sx={{ mt: 2 }}>
									<Grid item xs={12}>
										<Button
											variant="outlined"
											color="success"
											onClick={handleSubmit}
											fullWidth
										>
											Submit
										</Button>
									</Grid>
								</Grid>
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
