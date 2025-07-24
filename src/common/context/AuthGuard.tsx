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
	if (!token) {
		console.log("No token provided for role extraction");
		return Role.NONE;
	}

	try {
		// Decode the JWT token
		const decoded: any = jwtDecode(token);
		console.log("Decoded token claims:", decoded);

		// Check for role in custom claims
		const productionRole = decoded.claims.production;
		const stagingRole = decoded.claims.staging;
		const role = productionRole ?? stagingRole ?? Role.NONE;

		console.log("Role extraction:", {
			productionRole,
			stagingRole,
			finalRole: role,
			roleNames: {
				[Role.NONE]: "NONE",
				[Role.VOLUNTEER]: "VOLUNTEER",
				[Role.TEAM]: "TEAM",
				[Role.EXEC]: "EXEC",
				[Role.TECH]: "TECH",
				[Role.FINANCE]: "FINANCE",
			}[role as Role],
		});

		return role;
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

	// Handle redirect to auth server
	const redirectToAuth = () => {
		if (hasRedirected) {
			console.log("Redirect already attempted, preventing loop");
			return;
		}

		console.log("Redirecting to auth server");
		setHasRedirected(true);

		const currentUrl = window.location.href;
		const authUrl = new URL(`${finalConfig.authServerUrl}/login`);
		authUrl.searchParams.set("returnTo", currentUrl);

		if (finalConfig.redirectMode === "immediate") {
			window.location.href = authUrl.toString();
		}
	};

	// Check user authorization with detailed logging
	const checkAuthorization = (user: any, token?: string): boolean => {
		if (!user) {
			console.log("Authorization failed: No user");
			return false;
		}

		console.log("Authorization check:", {
			userEmail: user.email,
			hasToken: !!token,
			minimumRole: finalConfig.minimumRole,
			minimumRoleName: {
				[Role.NONE]: "NONE",
				[Role.VOLUNTEER]: "VOLUNTEER",
				[Role.TEAM]: "TEAM",
				[Role.EXEC]: "EXEC",
				[Role.TECH]: "TECH",
				[Role.FINANCE]: "FINANCE",
			}[finalConfig.minimumRole],
		});

		// If minimum role is NONE, any authenticated user is authorized
		if (finalConfig.minimumRole === Role.NONE) {
			console.log("Authorization passed: Minimum role is NONE");
			return true;
		}

		// Check role if minimum role is specified and token is available
		if (token) {
			const userRole = getRole(token);
			const authorized = userRole >= finalConfig.minimumRole;

			console.log("Role-based authorization:", {
				userRole,
				minimumRole: finalConfig.minimumRole,
				authorized,
				comparison: `${userRole} >= ${finalConfig.minimumRole} = ${authorized}`,
			});

			return authorized;
		} else {
			console.log(
				"Authorization failed: Token required for role check but not available"
			);
			return false;
		}
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
			userEmail: user?.email,
			token: !!token,
			authState,
			minimumRole: finalConfig.minimumRole,
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

	// Show unauthorized (insufficient role) with detailed error info
	if (authState === "unauthorized") {
		const userRole = token ? getRole(token) : Role.NONE;
		const roleNames = {
			[Role.NONE]: "None",
			[Role.VOLUNTEER]: "Volunteer",
			[Role.TEAM]: "Team Member",
			[Role.EXEC]: "Executive",
			[Role.TECH]: "Tech Team",
			[Role.FINANCE]: "Finance",
		};

		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
					<div className="space-y-2">
						<p className="text-gray-600">
							You don&apos;t have sufficient permissions to access this
							application.
						</p>
						<div className="text-sm text-gray-500 space-y-1">
							<p>
								Your role:{" "}
								<span className="font-medium">
									{roleNames[userRole as Role]}
								</span>
							</p>
							<p>
								Required role:{" "}
								<span className="font-medium">
									{roleNames[finalConfig.minimumRole]}
								</span>
							</p>
							<p>
								Signed in as: <span className="font-medium">{user?.email}</span>
							</p>
						</div>
					</div>
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
