"use client";

import React, { useCallback, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { useFirebase } from "@/components/context";
import { redirect } from "next/dist/server/api-utils";

const PasswordInput = ({ name, control }: { name: string; control: any }) => {
	const [showPassword, setShowPassword] = useState(false);

	const toggleShowPassword = () => setShowPassword((prev) => !prev);

	return (
		<Controller
			name={name}
			control={control}
			defaultValue=""
			render={({ field }) => (
				<TextField
					{...field}
					type={showPassword ? "text" : "password"}
					label="Password"
					fullWidth
					margin="normal"
					required
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton onClick={toggleShowPassword} edge="end">
									{showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
			)}
		/>
	);
};

export default function AuthScreen(): JSX.Element {
	const { loginWithEmailAndPassword, isAuthenticated } = useFirebase();
	const methods = useForm({ defaultValues: { email: "", password: "" } });
	const { handleSubmit, control } = methods;

	const onSubmit = useCallback(
		async (data: { email: string; password: string }) => {
			try {
				await loginWithEmailAndPassword(data.email, data.password);
                if (isAuthenticated) {
                    console.log("Redirecting to /scans");
                    window.location.href = "/scans";
                }
			} catch (error) {
				console.error(error);
			}
		},
		[isAuthenticated, loginWithEmailAndPassword]
	);

	return (
		<Container component="main" maxWidth="xs">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Typography component="h1" variant="h5">
					Sign in
				</Typography>
				<Box sx={{ mt: 1 }}>
					<FormProvider {...methods}>
						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									margin="normal"
									required
									fullWidth
									label="Email Address"
									autoComplete="email"
									autoFocus
								/>
							)}
						/>
						<PasswordInput name="password" control={control} />
						{/* You can implement a function to map privilege or user state to error messages */}
						{/* For demonstration, this just checks if the user is null to show a generic error */}
						{isAuthenticated === false && (
							<Alert severity="error" sx={{ mt: 2 }}>
								Failed to log in. Please check your credentials.
							</Alert>
						)}
						<Button
							type="submit"
							fullWidth
							variant="outlined"
							sx={{ mt: 3, mb: 2 }}
							onClick={handleSubmit(onSubmit)}
						>
							Sign In
						</Button>
					</FormProvider>
				</Box>
			</Box>
		</Container>
	);
}
