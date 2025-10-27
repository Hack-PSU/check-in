"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FirebaseProvider } from "./FirebaseProvider";
import { auth } from "@/common/config";
import { Box } from "@mui/material";
import { AuthGuard, Role } from "./AuthGuard";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			refetchOnWindowFocus: false,
			staleTime: 30000, // Consider data fresh for 30 seconds
		},
	},
});

export default function LayoutProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<FirebaseProvider>
				<QueryClientProvider client={queryClient}>
					<AuthGuard
						config={{
							minimumRole: Role.TEAM,
							authServerUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
						}}
					>
						{children}
					</AuthGuard>
				</QueryClientProvider>
			</FirebaseProvider>
		</>
	);
}
