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
	technical: "Technical Complexity / Impact",
	implementation: "Implementation",
	clarity: "Clarity",
	growth: "Knowledge and Growth",
	challenge1: "Challenge 1",
	challenge2: "Challenge 2",
	challenge3: "Challenge 3",
};

const JudgingPage: React.FC = () => {
	const { user } = useFirebase();
	// Project IDs assigned to this judge (based on existing score records)
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

	/**
	 * Once projects and scores are fetched, set the assigned projects.
	 * We assume that each assigned project already has a score record (even if not yet submitted).
	 */
	useEffect(() => {
		if (
			!loadingProjects &&
			!loadingScores &&
			user?.uid &&
			allProjects &&
			allScores
		) {
			// Filter out scores belonging to the current judge
			const judgeScores = allScores.filter(
				(score) => score.judge?.id === user.uid
			);
			// Extract unique project IDs from those scores
			const judgeProjectIds = Array.from(
				new Set(judgeScores.map((score) => score.project.id))
			);
			setAssignedProjects(judgeProjectIds);

			// Auto-select the first project if available.
			setSelectedProjectId(
				judgeProjectIds.length > 0 ? judgeProjectIds[0] : ""
			);
		}
	}, [user, allProjects, allScores, loadingProjects, loadingScores]);

	/**
	 * Whenever the selected project changes, load its existing score (if any)
	 * or initialize default score values.
	 */
	useEffect(() => {
		if (selectedProjectId !== "" && !loadingScores && user?.uid && allScores) {
			const existingScore = allScores.find(
				(score) =>
					score.judge?.id === user.uid && score.project.id === selectedProjectId
			);

			if (existingScore) {
				setScoreValues({
					creativity: existingScore.creativity ?? 0,
					technical: existingScore.technical ?? 0,
					implementation: existingScore.implementation ?? 0,
					clarity: existingScore.clarity ?? 0,
					growth: existingScore.growth ?? 0,
					challenge1: existingScore.challenge1 ?? 0,
					challenge2: existingScore.challenge2 ?? 0,
					challenge3: existingScore.challenge3 ?? 0,
					submitted: existingScore.submitted ?? false,
				});
			} else {
				setScoreValues({
					creativity: 0,
					technical: 0,
					implementation: 0,
					clarity: 0,
					growth: 0,
					challenge1: 0,
					challenge2: 0,
					challenge3: 0,
					submitted: false,
				});
			}
		}
	}, [selectedProjectId, allScores, loadingScores, user?.uid]);

	const handleProjectChange = (event: SelectChangeEvent<number>) => {
		setSelectedProjectId(event.target.value as number);
	};

	const handleScoreChange = (
		criteria: CriteriaType,
		value: number | number[]
	) => {
		setScoreValues((prev) => ({
			...prev,
			[criteria]: value as number,
		}));
	};

	const handleSnackbarClose = () => {
		setSnackbar(null);
	};

	// List of all criteria to be scored.
	const allCriteria = Object.keys(criteriaLabels) as CriteriaType[];

	const validateScores = () =>
		allCriteria.every(
			(criteria) =>
				typeof scoreValues[criteria] === "number" && scoreValues[criteria]! >= 0
		);

	/**
	 * Move to the next project that has not yet been submitted.
	 * It searches forward in the assignedProjects array,
	 * and if not found, it wraps around to check from the beginning.
	 * If every project is submitted, it clears the selection.
	 */
	const moveToNextProject = () => {
		if (selectedProjectId === "") return;

		const currentIndex = assignedProjects.indexOf(selectedProjectId as number);
		// Look for an unsubmitted project in the projects after the current one.
		const nextProjectId = assignedProjects
			.slice(currentIndex + 1)
			.find((projectId) => {
				const score = allScores?.find(
					(score) =>
						score.judge?.id === user?.uid && score.project.id === projectId
				);
				return score && !score.submitted;
			});

		if (nextProjectId !== undefined) {
			setSelectedProjectId(nextProjectId);
			return;
		}

		// If not found after current index, check from the beginning.
		const firstUnsubmitted = assignedProjects.find((projectId) => {
			const score = allScores?.find(
				(score) =>
					score.judge?.id === user?.uid && score.project.id === projectId
			);
			return score && !score.submitted;
		});

		if (firstUnsubmitted !== undefined) {
			setSelectedProjectId(firstUnsubmitted);
		} else {
			// All projects have been submitted.
			setSelectedProjectId("");
		}
	};

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

		// Determine if a score record already exists for this project.
		const existingScore = allScores?.find(
			(score) =>
				score.judge?.id === user.uid && score.project.id === selectedProjectId
		);

		// Build payload with the submitted scores.
		const payload: ScoreCreateEntity | ScoreUpdateEntity = {
			...scoreValues,
			submitted: true,
		};

		const onSuccess = (successMessage: string) => {
			setSnackbar({
				open: true,
				message: successMessage,
				severity: "success",
			});
			// Move to the next unsubmitted project after successful submission.
			moveToNextProject();
		};

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

	const renderCriteria = () =>
		allCriteria.map((criteriaKey) => (
			<Box key={criteriaKey} sx={{ mb: 4 }}>
				<Typography variant="h6">{criteriaLabels[criteriaKey]}</Typography>
				<Slider
					value={scoreValues[criteriaKey] ?? 0}
					onChange={(_, value) => handleScoreChange(criteriaKey, value)}
					step={1}
					marks
					min={0}
					max={5}
					valueLabelDisplay="on"
				/>
			</Box>
		));

	return (
		<Container maxWidth="md" sx={{ mt: 4 }}>
			<Paper elevation={3} sx={{ p: 4 }}>
				<Typography variant="h4" gutterBottom align="center">
					Project Judging
				</Typography>

				{(loadingProjects || loadingScores) && (
					<Typography align="center">Loading data...</Typography>
				)}

				{!loadingProjects &&
					!loadingScores &&
					(!assignedProjects || assignedProjects.length === 0) && (
						<Typography align="center">
							You have no assigned projects or all have been judged.
						</Typography>
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
									const projectName =
										allProjects?.find((proj) => proj.id === projectId)?.name ||
										`Project #${projectId}`;
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
