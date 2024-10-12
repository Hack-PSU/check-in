import React, { createContext, useContext, useEffect, useState } from "react";
import {
	Auth,
	AuthError,
	getIdToken,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	User,
	onIdTokenChanged,
} from "firebase/auth";
import { initApi, resetApi } from "@/common/api/axios";
import { jwtDecode, JwtPayload } from "jwt-decode";

type FirebaseJwtPayload = JwtPayload & {
	production?: number;
	staging?: number;
};

enum Role {
	NONE = 0,
	VOLUNTEER,
	TEAM,
	EXEC,
	TECH,
	FINANCE,
}

function extractAuthToken(token: string): string {
	return token.startsWith("Bearer ") ? token.slice(7) : token;
}

function decodeToken(token: string): FirebaseJwtPayload {
	return jwtDecode(token);
}

function getRole(token: string): Role {
	try {
		const extractedToken = extractAuthToken(token);
		const decodedToken = decodeToken(extractedToken);
		const role = decodedToken.production ?? decodedToken.staging;
		return role !== undefined ? (role as Role) : Role.NONE;
	} catch {
		return Role.NONE;
	}
}

type FirebaseProviderHooks = {
	isLoading: boolean;
	isAuthenticated: boolean;
	user?: User;
	token: string;
	error: string;
	loginWithEmailAndPassword(email: string, password: string): Promise<void>;
	logout(): Promise<void>;
};

type Props = {
	children: React.ReactNode;
	auth: Auth;
};

const FirebaseContext = createContext<FirebaseProviderHooks | null>(null);

const FirebaseProvider: React.FC<Props> = ({ children, auth }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		const handleAuthStateChange = async (currentUser: User | null) => {
			setIsLoading(true);
			if (currentUser) {
				try {
					const currentToken = await getIdToken(currentUser, true);
					setToken(currentToken);
					setUser(currentUser);
					initApi(currentUser);
				} catch (err) {
					console.error("Failed to get ID token:", err);
					setError("Failed to retrieve authentication token.");
					setToken("");
					setUser(null);
					resetApi();
				}
			} else {
				setToken("");
				setUser(null);
				resetApi();
			}
			setIsLoading(false);
		};

		const unsubscribeAuth = onAuthStateChanged(auth, handleAuthStateChange);
		const unsubscribeToken = onIdTokenChanged(auth, handleAuthStateChange);

		return () => {
			unsubscribeAuth();
			unsubscribeToken();
		};
	}, [auth]);

	const loginWithEmailAndPassword = async (email: string, password: string) => {
		setError("");
		setIsLoading(true);
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			const currentToken = await getIdToken(userCredential.user);
			if (getRole(currentToken) < Role.TEAM) {
				await signOut(auth);
				setError(
					"You do not have the required permissions to access this app."
				);
				setToken("");
				setUser(null);
				resetApi();
				return;
			}
			// The auth state listener will handle the rest
		} catch (err) {
			setError((err as AuthError).message || "Login failed");
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		try {
			await signOut(auth);
			// The auth state listener will handle the rest
		} catch (err) {
			setError((err as AuthError).message || "Logout failed");
		}
	};

	const value: FirebaseProviderHooks = {
		isLoading,
		isAuthenticated: !!user && !error,
		user: user || undefined,
		token,
		error,
		loginWithEmailAndPassword,
		logout,
	};

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
