"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page(): JSX.Element {
	const router = useRouter();

	useEffect(() => {
		router.replace("/schedule"); // replace so user can't "go back" to empty page
	}, [router]);

	return <></>;
}
