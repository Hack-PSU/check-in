"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { useFirebase } from "@/common/context";

const PasswordInput = ({ name, control }: { name: string; control: any }) => {
	const [showPassword, setShowPassword] = useState(false);

	const toggleShowPassword = () => setShowPassword((prev) => !prev);

	return (
		<Controller
			name={name}
			control={control}
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

export default function AuthScreen() {
	const router = useRouter();
	const { loginWithEmailAndPassword, isAuthenticated, logout, resetPassword } =
		useFirebase();
	const [loginError, setLoginError] = useState("");
	const [resetMessage, setResetMessage] = useState("");
	const [resetError, setResetError] = useState("");
	const [isLoading, setLoading] = useState(false);

	const methods = useForm({ defaultValues: { email: "", password: "" } });
	const { handleSubmit, control, getValues } = methods;

	const onSubmit = async (data: { email: string; password: string }) => {
		setLoading(true);
		setLoginError("");
		try {
			await loginWithEmailAndPassword(data.email, data.password);
		} catch (error: any) {
			const errorMessage = error.message || error;
			console.error(error);
			setLoginError(errorMessage);
		}
		setLoading(false);
	};

	const handleResetPassword = async () => {
		const email = getValues("email");
		if (!email) {
			setResetError("Please enter your email address to reset your password.");
			return;
		}
		setResetMessage("");
		setResetError("");
		try {
			await resetPassword(email);
			setResetMessage(
				"Password reset email sent successfully. Please check your inbox."
			);
		} catch (error: any) {
			const errorMessage = error.message || error;
			console.error(error);
			setResetError(errorMessage);
		}
	};

	useEffect(() => {
		if (isAuthenticated) {
			router.push("/scan");
		}
	}, [isAuthenticated, router]);

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout failed", error);
		}
	};

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
				<Box
					component="img"
					src={Math.random() < 0.2 ? "/clown.png" : "/logo.png"}
					alt="Logo"
					sx={{ width: "75%" }}
				/>
				<FormProvider {...methods}>
					<form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
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
						{loginError && (
							<Alert severity="error" sx={{ mt: 2 }}>
								{loginError}
							</Alert>
						)}
						{resetMessage && (
							<Alert severity="success" sx={{ mt: 2 }}>
								{resetMessage}
							</Alert>
						)}
						{resetError && (
							<Alert severity="error" sx={{ mt: 2 }}>
								{resetError}
							</Alert>
						)}
						<Button
							type="submit"
							fullWidth
							variant="outlined"
							sx={{ mt: 3, mb: 2 }}
							disabled={isLoading}
						>
							Sign In
						</Button>
						<Button
							type="button"
							fullWidth
							variant="text"
							sx={{ mb: 2 }}
							onClick={handleResetPassword}
							disabled={isLoading}
						>
							Forgot Password?
						</Button>
						{isAuthenticated && (
							<Button
								type="button"
								fullWidth
								variant="outlined"
								color="secondary"
								sx={{ mt: 1 }}
								onClick={handleLogout}
							>
								Log Out
							</Button>
						)}
					</form>
				</FormProvider>
			</Box>
			<Box component="footer" sx={{ mt: 8, mb: 4, textAlign: "center" }}>
				<Typography variant="body2" color="text.secondary">
					Made with ❤️ in Hacky Valley at 3 am last night
				</Typography>
			</Box>
		</Container>
	);
}
