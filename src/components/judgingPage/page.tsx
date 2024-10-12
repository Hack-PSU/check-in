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
import {
  getAllScoresByJudge,
  submitScore,
  ProjectScoreEntity,
  ScoreDataEntity,
} from "@/common/api";
import { useFirebase } from "@/components/context";
import { useRouter } from "next/navigation";

type CriteriaType =
  | "creativity"
  | "technical"
  | "implementation"
  | "clarity"
  | "growth";

const criteriaLabels: Record<CriteriaType, string> = {
  creativity: "Creativity and Originality",
  technical: "Technical Skills",
  implementation: "Implementation",
  clarity: "Clarity",
  growth: "Knowledge and Growth",
};

const JudgingPage: React.FC = () => {
  const { user } = useFirebase();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectScoreEntity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [scores, setScores] = useState<Partial<ScoreDataEntity>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  } | null>(null);

  // Fetch projects assigned to the judge and set default selection
  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          const response = await getAllScoresByJudge({ id: user.uid });
          const projectsData = response.data;
          setProjects(projectsData);
          if (projectsData.length > 0) {
            setSelectedProjectId(projectsData[0].id);
          }
        } catch (error) {
          console.error("Error fetching projects", error);
          setSnackbar({
            open: true,
            message: "Error fetching projects",
            severity: "error",
          });
        }
      }
    };

    fetchProjects();
  }, [user]);

  // Load scores when a project is selected
  useEffect(() => {
    if (selectedProjectId !== null) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project) {
        setScores(project.score || {});
      }
    }
  }, [selectedProjectId, projects]);

  const handleProjectChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setSelectedProjectId(event.target.value as number);
  };

  const handleScoreChange = (
    criteria: CriteriaType,
    value: number | number[]
  ) => {
    setScores((prevScores) => ({
      ...prevScores,
      [criteria]: value as number,
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbar(null);
  };

  const handleSubmit = async () => {
    if (!user || selectedProjectId === null) return;

    // Check if all criteria have been scored
    const allCriteriaScored = Object.keys(criteriaLabels).every(
      (key) => scores[key as CriteriaType] !== undefined
    );

    if (!allCriteriaScored) {
      setSnackbar({
        open: true,
        message: "Please score all criteria before submitting.",
        severity: "error",
      });
      return;
    }

    try {
      await submitScore(
        {
          ...scores,
          submitted: true,
          // Default challenge scores to -1
          challenge1: -1,
          challenge2: -1,
          challenge3: -1,
        },
        { id: user.uid, projectId: selectedProjectId }
      );
      setSnackbar({
        open: true,
        message: "Scores submitted successfully",
        severity: "success",
      });

      // Remove the submitted project from the list
      setProjects((prevProjects) =>
        prevProjects.filter((p) => p.id !== selectedProjectId)
      );

      // Select the next project or null if none left
      const remainingProjects = projects.filter(
        (p) => p.id !== selectedProjectId
      );
      if (remainingProjects.length > 0) {
        setSelectedProjectId(remainingProjects[0].id);
      } else {
        setSelectedProjectId(null);
      }
    } catch (error) {
      console.error("Error submitting scores", error);
      setSnackbar({
        open: true,
        message: "Error submitting scores",
        severity: "error",
      });
    }
  };

  const renderCriteria = () => {
    return (
      <>
        {Object.keys(criteriaLabels).map((key) => (
          <Box key={key} sx={{ mb: 4 }}>
            <Typography variant="h6">
              {criteriaLabels[key as CriteriaType]}
            </Typography>
            <Slider
              value={scores[key as CriteriaType] ?? 0}
              onChange={(event, value) =>
                handleScoreChange(key as CriteriaType, value)
              }
              step={1}
              marks
              min={0}
              max={5}
              valueLabelDisplay="on"
            />
          </Box>
        ))}
      </>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Project Judging
        </Typography>

        {projects.length > 0 ? (
          <>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel id="project-select-label">Select Project</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProjectId || ""}
                onChange={handleProjectChange}
                label="Select Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProjectId !== null ? (
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
            ) : (
              <Typography variant="h6" align="center">
                All projects have been judged.
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="h6" align="center">
            No projects assigned or all projects have been judged.
          </Typography>
        )}
      </Paper>

      {/* Snackbar Notifications */}
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
        >
          <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default JudgingPage;
