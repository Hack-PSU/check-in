import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
	FC,
} from "react";
import {
	Auth,
	User,
	getIdToken,
	onAuthStateChanged,
	onIdTokenChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	signOut,
	sendPasswordResetEmail,
	GoogleAuthProvider,
	GithubAuthProvider,
} from "firebase/auth";
import { jwtDecode } from "jwt-decode";
import { permission } from "process";

enum Role {
	NONE = 0,
	VOLUNTEER,
	TEAM,
	EXEC,
	TECH,
	FINANCE,
}

const MINIMUM_ROLE = Role.NONE; // Only users with a role >= TEAM may access the app

// Helpers to decode the JWT and extract the role claim.
// (Assumes your custom claim is stored under "production" or "staging".)
function extractAuthToken(token: string): string {
	return token.startsWith("Bearer ") ? token.slice(7) : token;
}

function getRole(token: string): number {
	try {
		const extractedToken = extractAuthToken(token);
		const decoded: any = jwtDecode(extractedToken);
		// Try to read the role from either "production" or "staging"
		const role = decoded.production ?? decoded.staging;
		return role !== undefined ? role : Role.NONE;
	} catch {
		return Role.NONE;
	}
}

// Public context type – notice we are not using custom error types here.
type FirebaseContextType = {
	isLoading: boolean;
	isAuthenticated: boolean;
	user?: User;
	permission?: number;
	token: string;
	error: string;
	loginWithEmailAndPassword(email: string, password: string): Promise<void>;
	signUpWithEmailAndPassword(email: string, password: string): Promise<void>;
	signInWithGoogle(): Promise<void>;
	signInWithGithub(): Promise<void>;
	resetPassword(email: string): Promise<void>;
	logout(): Promise<void>;
};

const FirebaseContext = createContext<FirebaseContextType | null>(null);

type Props = {
	children: React.ReactNode;
	auth: Auth;
};

const FirebaseProvider: FC<Props> = ({ children, auth }) => {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string>("");
	const [error, setError] = useState<string>("");

	// Listen for auth and token changes.
	useEffect(() => {
		// This handler is used by both onAuthStateChanged and onIdTokenChanged.
		const handleAuthChange = async (currentUser: User | null) => {
			setIsLoading(true);
			if (currentUser) {
				try {
					const currentToken = await getIdToken(currentUser, true);
					// Save the token and check if the user has sufficient permissions.
					if (getRole(currentToken) < MINIMUM_ROLE) {
						// Insufficient permissions: sign out and show an error.
						await signOut(auth);
						setError(
							"You do not have the required permissions to access this app."
						);
						setUser(null);
						setToken("");
					} else {
						setToken(currentToken);
						setUser(currentUser);
						setError("");
					}
				} catch (err) {
					console.error("Failed to retrieve ID token:", err);
					setError("Failed to retrieve authentication token.");
					setUser(null);
					setToken("");
				}
			} else {
				// User signed out.
				setUser(null);
				setToken("");
				setError("");
			}
			setIsLoading(false);
		};

		const unsubscribeAuth = onAuthStateChanged(auth, handleAuthChange);
		const unsubscribeToken = onIdTokenChanged(auth, handleAuthChange);

		return () => {
			unsubscribeAuth();
			unsubscribeToken();
		};
	}, [auth]);

	// Login using email and password.
	const loginWithEmailAndPassword = useCallback(
		async (email: string, password: string) => {
			setError("");
			setIsLoading(true);
			try {
				const userCredential = await signInWithEmailAndPassword(
					auth,
					email,
					password
				);
				const currentToken = await getIdToken(userCredential.user);
				if (getRole(currentToken) < MINIMUM_ROLE) {
					await signOut(auth);
					setError(
						"You do not have the required permissions to access this app."
					);
					return;
				}
				// The auth state listener will update the state.
			} catch (err: any) {
				setError(err.message || "Login failed");
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[auth]
	);

	// Sign up a new user.
	const signUpWithEmailAndPassword = useCallback(
		async (email: string, password: string) => {
			setError("");
			setIsLoading(true);
			try {
				const userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);
				const currentToken = await getIdToken(userCredential.user);
				if (getRole(currentToken) < MINIMUM_ROLE) {
					await signOut(auth);
					setError(
						"You do not have the required permissions to access this app."
					);
					return;
				}
				// The auth state listener will update the state.
			} catch (err: any) {
				setError(err.message || "Sign-up failed");
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[auth]
	);

	// Sign in with Google.
	const signInWithGoogle = useCallback(async () => {
		setError("");
		setIsLoading(true);
		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const currentToken = await getIdToken(userCredential.user);
			if (getRole(currentToken) < MINIMUM_ROLE) {
				await signOut(auth);
				setError(
					"You do not have the required permissions to access this app."
				);
				return;
			}
			// The auth state listener will update the state.
		} catch (err: any) {
			setError(err.message || "Google sign-in failed");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [auth]);

	// Sign in with GitHub.
	const signInWithGithub = useCallback(async () => {
		setError("");
		setIsLoading(true);
		try {
			const provider = new GithubAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const currentToken = await getIdToken(userCredential.user);
			if (getRole(currentToken) < MINIMUM_ROLE) {
				await signOut(auth);
				setError(
					"You do not have the required permissions to access this app."
				);
				return;
			}
			// The auth state listener will update the state.
		} catch (err: any) {
			setError(err.message || "GitHub sign-in failed");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [auth]);

	const actionCodeSettings = {
		url: "https://checkin.hackpsu.org/auth",
		handleCodeInApp: true,
	};
	// Send a password reset email.
	const resetPassword = useCallback(
		async (email: string) => {
			setError("");
			try {
				await sendPasswordResetEmail(auth, email, actionCodeSettings);
			} catch (err: any) {
				setError(err.message || "Password reset failed");
				throw err;
			}
		},
		[auth]
	);

	// Log out.
	const logout = useCallback(async () => {
		setError("");
		setIsLoading(true);
		try {
			await signOut(auth);
			// The auth state listener will update the state.
		} catch (err: any) {
			setError(err.message || "Logout failed");
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [auth]);

	const value = useMemo(
		() => ({
			isLoading,
			isAuthenticated: !!user && !error,
			permission: user ? getRole(token) : undefined,
			user: user || undefined,
			token,
			error,
			loginWithEmailAndPassword,
			signUpWithEmailAndPassword,
			signInWithGoogle,
			signInWithGithub,
			resetPassword,
			logout,
		}),
		[
			isLoading,
			user,
			permission,
			token,
			error,
			loginWithEmailAndPassword,
			signUpWithEmailAndPassword,
			signInWithGoogle,
			signInWithGithub,
			resetPassword,
			logout,
		]
	);

	return (
		<FirebaseContext.Provider value={value}>
			{children}
		</FirebaseContext.Provider>
	);
};

export const useFirebase = () => {
	const context = useContext(FirebaseContext);
	if (!context) {
		throw new Error("useFirebase must be used within a FirebaseProvider");
	}
	return context;
};

export default FirebaseProvider;
