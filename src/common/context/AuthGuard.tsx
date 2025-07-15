"use client";

import { useEffect, useState, type ReactNode } from "react";
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
	loadingTimeout: 5000,
	minimumRole: Role.NONE,
};

// Simple loading component
function SimpleLoading() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
			<div className="text-center space-y-4">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
				<p className="text-gray-600">Loading...</p>
			</div>
		</div>
	);
}

// Decode and extract role claim
function extractAuthToken(token: string) {
	return token.startsWith("Bearer ") ? token.slice(7) : token;
}

function getRole(token: string): number {
	try {
		const decoded: any = jwtDecode(extractAuthToken(token));
		return decoded.production ?? decoded.staging ?? Role.NONE;
	} catch {
		return Role.NONE;
	}
}

export function AuthGuard({ children, config = {} }: SimpleAuthGuardProps) {
	const finalConfig = { ...defaultConfig, ...config };
	const { user, isLoading, token } = useFirebase();
	const [authState, setAuthState] = useState<
		"checking" | "authenticated" | "unauthenticated" | "unauthorized"
	>("checking");

	// Handle redirect to auth server
	const redirectToAuth = () => {
		const currentUrl = window.location.href;
		const authUrl = new URL(`${finalConfig.authServerUrl}/login`);
		authUrl.searchParams.set("returnTo", currentUrl);

		if (finalConfig.redirectMode === "immediate") {
			window.location.href = authUrl.toString();
		}
	};

	// Check user authorization
	const checkAuthorization = (user: any, token?: string): boolean => {
		if (!user) return false;

		// Check role if minimum role is specified and token is available
		if (finalConfig.minimumRole !== Role.NONE && token) {
			const userRole = getRole(token);
			return userRole >= finalConfig.minimumRole;
		}

		return true;
	};

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (isLoading && finalConfig.loadingTimeout) {
			timeoutId = setTimeout(() => {
				if (isLoading) {
					// If still loading after timeout, redirect anyway
					redirectToAuth();
				}
			}, finalConfig.loadingTimeout);
		}

		if (!isLoading) {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			if (user) {
				const authorized = checkAuthorization(user, token);
				setAuthState(authorized ? "authenticated" : "unauthorized");
			} else {
				setAuthState("unauthenticated");
				redirectToAuth();
			}
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [isLoading, user, token]);

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
						You don&apos;t have sufficient permissions to access this application.
					</p>
					<button
						onClick={redirectToAuth}
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
						onClick={redirectToAuth}
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
	return <div>Loading...</div>;
}

// Export Role enum for use in configs
export { Role };
