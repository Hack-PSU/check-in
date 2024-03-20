"use-client";

import React, { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	Auth,
	AuthError,
	AuthErrorCodes,
	getIdToken,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	User,
	createUserWithEmailAndPassword, onIdTokenChanged,
} from "firebase/auth";

export enum FirebaseAuthError {
	NONE,
	INVALID_EMAIL,
	INVALID_PASSWORD,
	EMAIL_EXISTS,
	WEAK_PASSWORD,
}

type FirebaseProviderHooks = {
	isAuthenticated: boolean;
	user?: User;
	token: string;
	error: FirebaseAuthError;
	signUpWithEmailAndPassword(email: string, password: string): Promise<void>;
	loginWithEmailAndPassword(email: string, password: string): Promise<void>;
	logout(next?: () => Promise<void>): Promise<void>;
}

type Props = {
	children: React.ReactNode;
	auth: Auth;
}

const FirebaseContext = createContext<FirebaseProviderHooks>({} as FirebaseProviderHooks);

const FirebaseProvider: FC<Props> = ({ children, auth }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [user, setUser] = useState<User | undefined>();
	const [error, setError] = useState<FirebaseAuthError>(FirebaseAuthError.NONE);
	const [token, setToken] = useState<string>("");

	const getUserIdToken = useCallback(async (user: User) => {
		return await getIdToken(user);
	}, []);

	const resolveAuthError = useCallback((error: AuthError) => {
		switch (error.code) {
			case AuthErrorCodes.EMAIL_EXISTS:
				setError(FirebaseAuthError.EMAIL_EXISTS);
				break;
			case AuthErrorCodes.INVALID_EMAIL:
				setError(FirebaseAuthError.INVALID_EMAIL);
				break;
			case AuthErrorCodes.INVALID_PASSWORD:
				setError(FirebaseAuthError.INVALID_PASSWORD);
				break;
			case AuthErrorCodes.WEAK_PASSWORD:
				setError(FirebaseAuthError.WEAK_PASSWORD);
				break;
		}
	}, []);

	const resolveAuthState = useCallback(async (user?: User) => {
		if (user) {
			const token = await getUserIdToken(user);
			setToken(token);
			setUser(user);
			setIsAuthenticated(true);
			console.log("user exists");
		} else {
			setUser(undefined);
			setIsAuthenticated(false);
			setError(FirebaseAuthError.NONE);
		}
	}, [getUserIdToken]);

	const signUpWithEmailAndPassword: FirebaseProviderHooks["signUpWithEmailAndPassword"] =
		useCallback(
			async (email: string, password: string) => {
				setError(FirebaseAuthError.NONE);
				try {
					const userCredential = await createUserWithEmailAndPassword(
						auth,
						email,
						password
					);

					if (userCredential.user) {
						await resolveAuthState(userCredential.user);
					}
				} catch (e) {
					resolveAuthError(e as AuthError);
				}
			},
			[auth, resolveAuthError, resolveAuthState]
		);

	const loginWithEmailAndPassword: FirebaseProviderHooks["loginWithEmailAndPassword"] =
		useCallback(
		async (email, password) => {
			setError(FirebaseAuthError.NONE);
			try {
				const userCredential = await signInWithEmailAndPassword(
					auth,
					email,
					password,
				);

				if (userCredential.user) {
					await resolveAuthState(userCredential.user)
				}
			} catch (e) {
				resolveAuthError(e as AuthError)
			}
		},
	[auth, resolveAuthError, resolveAuthState]
	);

	const logout: FirebaseProviderHooks["logout"] =
		useCallback(async (next) => {
			try {
				await signOut(auth);
				setToken("");
				setIsAuthenticated(false);

				await next?.();
			} catch (e) {
				console.error(e);
			}
		}, [auth]);

	useEffect(() => {
		return onAuthStateChanged(auth, async (user) => {
			await resolveAuthState(user ?? undefined);
		});
	}, [auth, resolveAuthState]);

	useEffect(() => {
		return onIdTokenChanged(auth, async (user) => {
			// initialize api if user exists
			if (user) {
				console.log("user exists");
			} else {
				console.log("user does not exist");
			}
		});
	}, [auth]);

	const value = useMemo(() => ({
		isAuthenticated,
		user,
		error,
		token,
		signUpWithEmailAndPassword,
		loginWithEmailAndPassword,
		logout,
	}), [
		isAuthenticated,
		user,
		error,
		token,
		signUpWithEmailAndPassword,
		loginWithEmailAndPassword,
		logout,
	]);
	return (
		<FirebaseContext.Provider value={value}> {children} </FirebaseContext.Provider>
	);
};

export const useFirebase = () => useContext(FirebaseContext);
export default FirebaseProvider;
