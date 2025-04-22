import React, { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFirebase } from "@/common/context";

type AuthGuardProps = {
	children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { isLoading, isAuthenticated } = useFirebase();

	useEffect(() => {
		if (isLoading) return;

		// If not logged in and trying to access any page except /auth, redirect to /auth
		if (!isAuthenticated && pathname !== "/auth") {
			router.replace("/auth");
		}

		// If already logged in and on /auth, redirect to home
		if (isAuthenticated && pathname === "/auth") {
			router.replace("/scan");
		}

		// If already logged in and on /, redirect to /scan
		if (isAuthenticated && pathname === "/") {
			router.replace("/scan");
		}
	}, [isLoading, isAuthenticated, pathname, router]);

	if (isLoading) {
		return null;
	}

	if (isAuthenticated || pathname === "/auth") {
		return <>{children}</>;
	}

	// Otherwise, nothing (redirect is in flight)
	return null;
}
