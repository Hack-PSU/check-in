"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FirebaseProvider from "./FirebaseProvider";
import { auth } from "@/common/config";
import { Box } from "@mui/material";
import AuthGuard from "./AuthGuard";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
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
			<FirebaseProvider auth={auth}>
				<QueryClientProvider client={queryClient}>
					<AuthGuard>{children}</AuthGuard>
				</QueryClientProvider>
			</FirebaseProvider>
		</>
	);
}
