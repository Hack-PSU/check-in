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
	AuthErrorCodes,
} from "firebase/auth";
import { initApi, resetApi } from "@/common/api/axios";
import { jwtDecode, JwtPayload } from "jwt-decode";

type FirebaseJwtPayload = JwtPayload & {
	production?: number;
	staging?: number;
};

enum AuthEnvironment {
	PROD = "production",
	STAGING = "staging",
}
enum Role {
	NONE,
	VOLUNTEER,
	TEAM,
	EXEC,
	TECH,
	FINANCE,
}

function extractAuthToken(token: string): string {
	return token.startsWith("Bearer") ? token.replace("Bearer ", "") : token;
}
function decodeToken(token: string): FirebaseJwtPayload {
	return jwtDecode(token) as FirebaseJwtPayload;
}

export function getRole(token: string): Role {
	try {
		const extractToken = extractAuthToken(token);
		const decodedToken = decodeToken(extractToken);
		const role = decodedToken[AuthEnvironment.PROD];
		return role ? (role as Role) : Role.NONE;
	} catch (error) {
		return Role.NONE;
	}
}

type FirebaseProviderHooks = {
	isLoading: boolean;
	isAuthenticated: boolean;
	user?: User;
	token: string;
	error: string; // Using a simple string for error messages
	loginWithEmailAndPassword(email: string, password: string): Promise<void>;
	logout(): Promise<void>;
};

type Props = {
	children: React.ReactNode;
	auth: Auth;
};

const FirebaseContext = createContext<FirebaseProviderHooks>(
	{} as FirebaseProviderHooks
);

const FirebaseProvider: React.FC<Props> = ({ children, auth }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<User | undefined>();
	const [token, setToken] = useState("");
	const [error, setError] = useState("");

	const handleAuthStateChange = async (user: User | null) => {
		setIsLoading(true);
		if (user) {
			initApi(user);
			setToken(token);
			setUser(user);
		} else {
			setToken("");
			setUser(undefined);
			resetApi();
		}
		setIsLoading(false);
	};

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, handleAuthStateChange);
		const unsubscribeToken = onIdTokenChanged(auth, handleAuthStateChange);
		return () => {
			unsubscribeAuth();
			unsubscribeToken();
		};
	}, [auth]);

	const loginWithEmailAndPassword = async (email: string, password: string) => {
		setError("");
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			const token = await getIdToken(userCredential.user);
			if (getRole(token) < Role.TEAM) {
				logout();
				setError(
					"You do not have the required permissions to access this app."
				);
				throw AuthErrorCodes.INTERNAL_ERROR;
			}
			handleAuthStateChange(userCredential.user);
		} catch (error) {
			setError((error as AuthError).message);
			throw error;
		}
	};

	const logout = async () => {
		try {
			await signOut(auth);
			handleAuthStateChange(null);
		} catch (error) {
			setError((error as AuthError).message); // Handle logout errors
		}
	};

	const value = {
		isLoading,
		isAuthenticated: !!user && error === "",
		user,
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

export const useFirebase = () => useContext(FirebaseContext);
export default FirebaseProvider;
