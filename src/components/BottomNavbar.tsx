// components/NavBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	QrCodeIcon,
	UserCheckIcon,
	GavelIcon,
	LogOutIcon,
	LaptopIcon,
	ToggleRightIcon,
	LucideProps,
} from "lucide-react";
import { useFirebase } from "@/common/context";
import { cn } from "@/lib/utils";

interface NavItem {
	name: string;
	url: string;
	icon: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
	isLogout?: boolean;
}

export function BottomNav({ className }: { className?: string }) {
	const { logout } = useFirebase();
	const router = useRouter();
	const path = usePathname();
	const [activeTab, setActiveTab] = useState("Log Out");

	const items: NavItem[] = [
		{ name: "Scanner", url: "/scan", icon: QrCodeIcon },
		{ name: "Manual Check In", url: "/manual", icon: UserCheckIcon },
		{ name: "Judging", url: "/judging", icon: GavelIcon },
		{ name: "Log Out", url: "/auth", icon: LogOutIcon, isLogout: true },
		{ name: "Logs", url: "/logs", icon: LaptopIcon },
		{ name: "Flags", url: "/flag", icon: ToggleRightIcon },
	];

	return (
		<div
			className={cn(
				"fixed bottom-0 sm:bottom-0 left-1/2 -translate-x-1/2 z-999 mb-6 sm:pt-6",
				className
			)}
		>
			<div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-[2px] py-1 px-1 rounded-full shadow-lg">
				{items.map((item) => {
					const Icon = item.icon;
					const isActive = activeTab === item.name;

					const handleClick = async () => {
						if (item.isLogout) {
							await logout();
						}
						setActiveTab(item.name);
						router.push(item.url);
					};

					return (
						<Link
							key={item.name}
							href={item.url}
							onClick={handleClick}
							className={cn(
								"relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
								"text-foreground/80 hover:text-primary",
								isActive && "bg-muted text-primary"
							)}
						>
							<span className="hidden md:inline">{item.name}</span>
							<span className="md:hidden">
								<Icon size={18} strokeWidth={2.5} />
							</span>

							{isActive && (
								<motion.div
									layoutId="lamp"
									className="absolute inset-0 w-full bg-primary/200 rounded-full -z-10"
									initial={false}
									transition={{
										type: "spring",
										stiffness: 300,
										damping: 30,
									}}
								></motion.div>
							)}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
