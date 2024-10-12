import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Container,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Snackbar,
  Autocomplete,
  TextField,
  Box,
  Alert,
} from "@mui/material";
import {
  getAllEvents,
  EventEntity,
  getAllUsers,
  UserEntity,
  checkInUserToEvent,
} from "@/common/api";
import { useFirebase } from "@/components/context";

const ManualCheckIn: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const { user } = useFirebase();

  // Fetch events and users when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedEvents, fetchedUsers] = await Promise.all([
          getAllEvents(),
          getAllUsers(),
        ]);
        setEvents(fetchedEvents.data);
        setUsers(fetchedUsers.data);
        // Set default event if available
        if (fetchedEvents.data.length > 0) {
          setSelectedEvent(fetchedEvents.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching data", error);
        setSnackbar({
          open: true,
          message: "Error fetching events or users",
          severity: "error",
        });
      }
    };

    fetchData();
  }, []);

  const handleCheckIn = useCallback(async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "You must be logged in to perform this action",
        severity: "error",
      });
      return;
    }
    if (!selectedUser) {
      setSnackbar({
        open: true,
        message: "Please select a user",
        severity: "error",
      });
      return;
    }
    if (!selectedEvent) {
      setSnackbar({
        open: true,
        message: "Please select an event",
        severity: "error",
      });
      return;
    }

    try {
      await checkInUserToEvent(
        { organizerId: user.uid },
        { userId: selectedUser.id, eventId: selectedEvent }
      );
      setSnackbar({
        open: true,
        message: `${selectedUser.firstName} ${selectedUser.lastName} checked in successfully`,
        severity: "success",
      });
      // Reset the selected user after successful check-in
      setSelectedUser(null);
    } catch (error) {
      console.error("Check-in failed", error);
      setSnackbar({
        open: true,
        message: "Check-in failed",
        severity: "error",
      });
    }
  }, [user, selectedUser, selectedEvent]);

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbar(null);
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: 4 }}>
      <Typography variant="h6" gutterBottom>
        Manual User Check-In
      </Typography>

      <Autocomplete
        options={users}
        value={selectedUser}
        onChange={(event, newValue) => setSelectedUser(newValue)}
        getOptionLabel={(option) =>
          `${option.firstName} ${option.lastName} (${option.email})`
        }
        renderInput={(params) => (
          <TextField {...params} label="Search User" variant="outlined" />
        )}
        fullWidth
        sx={{ marginTop: 2 }}
      />

      <FormControl fullWidth sx={{ marginTop: 2 }}>
        <InputLabel id="event-select-label">Select Event</InputLabel>
        <Select
          labelId="event-select-label"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value as string)}
          label="Select Event"
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box display="flex" justifyContent="center" marginTop={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckIn}
          disabled={!selectedUser || !selectedEvent}
        >
          Check In User
        </Button>
      </Box>

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

export default ManualCheckIn;
