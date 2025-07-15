
"use client";

import type React from "react";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
	type FC,
} from "react";
import { type Auth, type User, signOut } from "firebase/auth";
import { auth } from "@/common/config/firebase";

type FirebaseContextType = {
	auth: Auth;
	isLoading: boolean;
	isAuthenticated: boolean;
	user?: User;
	token?: string;
	error?: string;
	verifySession(): Promise<void>;
	logout(): Promise<void>;
};

const FirebaseContext = createContext<FirebaseContextType | null>(null);

type Props = { children: React.ReactNode };

export const FirebaseProvider: FC<Props> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);
	const [hasInitialized, setHasInitialized] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	// Verify session with the auth server
	const verifySession = useCallback(async () => {
		// Don't verify session if we're in the middle of logging out
		if (isLoggingOut) {
			console.log("Skipping session verification - logout in progress");
			return;
		}

		console.log("Verifying session...");
		try {
			const response = await fetch("https://auth.hackpsu.org/api/sessionUser", {
				method: "GET",
				credentials: "include", // Include cookies for cross-origin requests
				headers: {
					"Content-Type": "application/json",
				},
			});

			console.log("Session verification response:", response.status);

			if (!response.ok) {
				throw new Error(`Session verification failed: ${response.status}`);
			}

			const data = await response.json();
			console.log("Session data received:", !!data.customToken);

			if (data.customToken) {
				// Sign in with the custom token from the auth server
				const { signInWithCustomToken } = await import("firebase/auth");
				const userCredential = await signInWithCustomToken(
					auth,
					data.customToken
				);

				console.log("Firebase sign-in successful:", userCredential.user.email);
				setUser(userCredential.user);
				setToken(data.customToken);
				setError(undefined);
			} else {
				throw new Error("No custom token received");
			}
		} catch (err) {
			console.error("Session verification failed:", err);
			setUser(null);
			setToken(undefined);
			setError(
				err instanceof Error ? err.message : "Session verification failed"
			);
			throw err;
		}
	}, [isLoggingOut]);

	// Check for existing session on mount
	useEffect(() => {
		if (hasInitialized || isLoggingOut) return;

		const checkSession = async () => {
			console.log("Initial session check...");
			setIsLoading(true);
			try {
				// Add a timeout to prevent long waits
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Session check timeout")), 5000)
				);

				await Promise.race([verifySession(), timeoutPromise]);
				console.log("Initial session check successful");
			} catch (err) {
				// Session verification failed, user needs to authenticate
				console.log("No valid session found or timeout occurred:", err);
			} finally {
				setIsLoading(false);
				setHasInitialized(true);
			}
		};

		checkSession();
	}, [verifySession, hasInitialized, isLoggingOut]);

	// Logout function with proper cleanup
	const logout = useCallback(async () => {
		console.log("Starting logout process...");
		setIsLoggingOut(true);
		setError(undefined);
		setIsLoading(true);

		try {
			// First, clear the session on the auth server
			console.log("Clearing auth server session...");
			await fetch("https://auth.hackpsu.org/api/sessionLogout", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Then sign out from Firebase
			console.log("Signing out from Firebase...");
			await signOut(auth);

			// Clear local state
			setUser(null);
			setToken(undefined);

			console.log("Logout successful");

			// Add a small delay to ensure cleanup is complete
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Redirect to a logout confirmation page or home page instead of letting auth guard redirect
			window.location.href = "https://auth.hackpsu.org/logout-complete";
		} catch (e: any) {
			console.error("Logout failed:", e);
			setError(e.message);
			throw e;
		} finally {
			setIsLoading(false);
			setIsLoggingOut(false);
		}
	}, []);

	const value = useMemo(
		() => ({
			auth,
			isLoading,
			isAuthenticated: !!user && !isLoggingOut,
			user: user || undefined,
			token,
			error,
			verifySession,
			logout,
		}),
		[isLoading, user, token, error, verifySession, logout, isLoggingOut]
	);

	return (
		<FirebaseContext.Provider value={value}>
			{children}
		</FirebaseContext.Provider>
	);
};

export const useFirebase = () => {
	const ctx = useContext(FirebaseContext);
	if (!ctx) throw new Error("useFirebase must be used within FirebaseProvider");
	return ctx;
};
