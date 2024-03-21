"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";

export default function Page(): JSX.Element {
	const router = useRouter();
	useEffect(() => {
        router.push("/auth");
	}, [router]);
	return (
		<div>
			<h1>Page</h1>
		</div>
	);
}
