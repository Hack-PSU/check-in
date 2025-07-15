"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { useFirebase } from "@/common/context/FirebaseProvider";
import { jwtDecode } from "jwt-decode";

// Internal role definitions (used for permission checking only)
enum Role {
	NONE = 0,
	VOLUNTEER = 1,
	TEAM = 2,
	EXEC = 3,
	TECH = 4,
	FINANCE = 5,
}

interface SimpleAuthGuardConfig {
	authServerUrl?: string;
	redirectMode?: "immediate" | "manual";
	showLoadingScreen?: boolean;
	loadingTimeout?: number;
	minimumRole?: Role;
}

interface SimpleAuthGuardProps {
	children: ReactNode;
	config?: SimpleAuthGuardConfig;
}

const defaultConfig: Required<SimpleAuthGuardConfig> = {
	authServerUrl: "https://auth.hackpsu.org",
	redirectMode: "immediate",
	showLoadingScreen: true,
	loadingTimeout: 8000,
	minimumRole: Role.NONE,
};

// Simple loading component
function SimpleLoading() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
			<div className="text-center space-y-4">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
				<p className="text-gray-600">Verifying authentication...</p>
			</div>
		</div>
	);
}

// Extract role from Firebase token or custom claims
function getRole(token: string | undefined): number {
	if (!token) return Role.NONE;

	try {
		// Decode the JWT token
		const decoded: any = jwtDecode(token);

		// Check for role in custom claims
		// First check production, then staging, then default to NONE
		return decoded.production ?? decoded.staging ?? Role.NONE;
	} catch (error) {
		console.error("Error decoding token:", error);
		return Role.NONE;
	}
}

export function AuthGuard({ children, config = {} }: SimpleAuthGuardProps) {
	const finalConfig = { ...defaultConfig, ...config };
	const { user, isLoading, token, verifySession } = useFirebase();
	const [authState, setAuthState] = useState<
		"checking" | "authenticated" | "unauthenticated" | "unauthorized"
	>("checking");
	const [hasRedirected, setHasRedirected] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const mountedRef = useRef(true);

	// Check if we just came back from auth server or logout
	const isReturningFromAuth = () => {
		const urlParams = new URLSearchParams(window.location.search);
		const referrer = document.referrer;
		return (
			urlParams.has("returnTo") ||
			referrer.includes(finalConfig.authServerUrl) ||
			referrer.includes("logout-complete")
		);
	};

	// Handle redirect to auth server with logout flag
	const redirectToAuth = () => {
		// Prevent multiple redirects
		if (hasRedirected) {
			console.log("Redirect already attempted, preventing loop");
			return;
		}

		// Don't redirect if we just came back from auth server
		if (isReturningFromAuth()) {
			console.log(
				"Just returned from auth server, waiting for session verification"
			);
			return;
		}

		console.log("Redirecting to auth server with logout flag");
		setHasRedirected(true);

		const currentUrl = window.location.href;
		const authUrl = new URL(`${finalConfig.authServerUrl}/login`);
		authUrl.searchParams.set("returnTo", currentUrl);
		authUrl.searchParams.set("logout", "true"); // Force logout on auth server

		if (finalConfig.redirectMode === "immediate") {
			window.location.href = authUrl.toString();
		}
	};

	// Check user authorization
	const checkAuthorization = (user: any, token?: string): boolean => {
		if (!user) return false;

		if (finalConfig.minimumRole !== Role.NONE && token) {
			const userRole = getRole(token);
			return userRole >= finalConfig.minimumRole;
		}

		return true;
	};

	// Retry session verification
	const retryVerification = async () => {
		if (retryCount >= 3) {
			console.log("Max retries reached, redirecting to auth");
			redirectToAuth();
			return;
		}

		console.log(`Retrying session verification (attempt ${retryCount + 1})`);
		setRetryCount((prev) => prev + 1);

		try {
			await verifySession();
		} catch (error) {
			console.error("Session verification failed:", error);
		}
	};

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		console.log("Auth state check:", {
			isLoading,
			user: !!user,
			token: !!token,
			authState,
		});

		if (isLoading && finalConfig.loadingTimeout) {
			timeoutId = setTimeout(() => {
				if (mountedRef.current && isLoading) {
					console.log("Loading timeout reached, attempting retry");
					retryVerification();
				}
			}, finalConfig.loadingTimeout);
		}

		if (!isLoading) {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			if (user) {
				const authorized = checkAuthorization(user, token);
				console.log("User found, authorized:", authorized);
				setAuthState(authorized ? "authenticated" : "unauthorized");
			} else {
				console.log("No user found");
				setAuthState("unauthenticated");

				setTimeout(() => {
					if (mountedRef.current && !user && !hasRedirected) {
						redirectToAuth();
					}
				}, 1000);
			}
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [isLoading, user, token, retryCount]);

	// Show loading
	if (authState === "checking" && finalConfig.showLoadingScreen) {
		return <SimpleLoading />;
	}

	// Show unauthorized (insufficient role)
	if (authState === "unauthorized") {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
					<p className="text-gray-600">
						You don&apso;t have sufficient permissions to access this application.
					</p>
					<button
						onClick={() => {
							setHasRedirected(false);
							redirectToAuth();
						}}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Try Different Account
					</button>
				</div>
			</div>
		);
	}

	// Show unauthenticated (manual redirect mode)
	if (
		authState === "unauthenticated" &&
		finalConfig.redirectMode === "manual"
	) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-gray-900">Sign In Required</h1>
					<p className="text-gray-600">Please sign in to continue.</p>
					<button
						onClick={() => {
							setHasRedirected(false);
							redirectToAuth();
						}}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Continue to Sign In
					</button>
				</div>
			</div>
		);
	}

	// Render authenticated content
	if (authState === "authenticated") {
		return <>{children}</>;
	}

	// Default loading state
	return <SimpleLoading />;
}

// Export Role enum for use in configs
export { Role };
