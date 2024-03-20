"use client";
import { useEffect } from "react";

const Custom404: React.FC = () => {
	useEffect(() => {
		const redirectTimeout = setTimeout(() => {
			window.location.href = "/";
		}, 3000);

		return () => clearTimeout(redirectTimeout);
	}, []);

	return (
		<section className="flex flex-col items-center justify-center h-screen">
			<div className="frame flex flex-col w-4/5 p-4 text-3xl font-bold text-white text-center cornerstone-font">
				<h1>Page Not Found!</h1>
				<p className="mt-2">Redirecting to the home page...</p>
			</div>
		</section>
	);
};

export default Custom404;
