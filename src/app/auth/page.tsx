"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/common/context";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";

type FormValues = {
	email: string;
	password: string;
};

export default function AuthScreen() {
	const router = useRouter();
	const { loginWithEmailAndPassword, isAuthenticated, logout, resetPassword } =
		useFirebase();

	const [loginError, setLoginError] = useState("");
	const [resetMessage, setResetMessage] = useState("");
	const [resetError, setResetError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const methods = useForm<FormValues>({
		defaultValues: { email: "", password: "" },
	});
	const { handleSubmit, control, getValues } = methods;

	useEffect(() => {
		if (isAuthenticated) {
			router.push("/scan");
		}
	}, [isAuthenticated, router]);

	const onSubmit = async (data: FormValues) => {
		setIsLoading(true);
		setLoginError("");
		try {
			await loginWithEmailAndPassword(data.email, data.password);
		} catch (err: any) {
			setLoginError(err.message || String(err));
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async () => {
		const email = getValues("email");
		if (!email) {
			setResetError("Please enter your email to reset your password.");
			return;
		}
		setResetMessage("");
		setResetError("");
		try {
			await resetPassword(email);
			setResetMessage("Password reset email sent. Check your inbox.");
		} catch (err: any) {
			setResetError(err.message || String(err));
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch {
			/* swallow */
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardContent className="flex flex-col items-center p-6">
					<img
						src="/logo.png"
						alt="Logo"
						className="w-3/4 mb-6 select-none pointer-events-none"
					/>

					<FormProvider {...methods}>
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="w-full space-y-4"
						>
							<div>
								<Label htmlFor="email">Email Address</Label>
								<Controller
									name="email"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											id="email"
											type="email"
											required
											placeholder="you@example.com"
										/>
									)}
								/>
							</div>

							<div className="relative">
								<Label htmlFor="password">Password</Label>
								<Controller
									name="password"
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											id="password"
											type={showPassword ? "text" : "password"}
											required
											className="pr-10"
											placeholder=""
										/>
									)}
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute inset-y-0 right-0 flex items-center pr-3 pt-6"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5 text-muted-foreground" />
									) : (
										<Eye className="h-5 w-5 text-muted-foreground" />
									)}
								</button>
							</div>

							{loginError && (
								<Alert variant="destructive">
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>{loginError}</AlertDescription>
								</Alert>
							)}
							{resetMessage && (
								<Alert>
									<AlertDescription>{resetMessage}</AlertDescription>
								</Alert>
							)}
							{resetError && (
								<Alert variant="destructive">
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>{resetError}</AlertDescription>
								</Alert>
							)}

							<Button type="submit" className="w-full" disabled={isLoading}>
								Sign In
							</Button>
							<Button
								type="button"
								variant="link"
								className="w-full"
								onClick={handleResetPassword}
								disabled={isLoading}
							>
								Forgot Password?
							</Button>
							{isAuthenticated && (
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={handleLogout}
								>
									Log Out
								</Button>
							)}
						</form>
					</FormProvider>
				</CardContent>

				<div className="px-6 pb-6 text-center">
					<p className="text-sm text-muted-foreground">
						Made with ❤️ in Hacky Valley at 3 am last night
					</p>
				</div>
			</Card>
		</div>
	);
}
