"use client";
import FirebaseProvider from "./FirebaseProvider";
import { auth } from "@/common/config";

export default function LayoutProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<FirebaseProvider auth={auth}>{children}</FirebaseProvider>
		</>
	);
}
