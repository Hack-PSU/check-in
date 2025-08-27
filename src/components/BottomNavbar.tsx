"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
	QrCodeIcon,
	GavelIcon,
	LogOutIcon,
	LaptopIcon,
	LucideCalendarDays,
	ChevronDownIcon,
	LucideProps,
	ToggleRight,
} from "lucide-react";
import { useFirebase } from "@/common/context";
import { cn } from "@/lib/utils";

interface NavSubItem {
	name: string;
	url: string;
	icon?: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
}

interface NavItem {
	name: string;
	url: string;
	icon: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
	isLogout?: boolean;
	children?: NavSubItem[];
}

export function BottomNav({ className }: { className?: string }) {
	const { user, logout } = useFirebase();
	const router = useRouter();
	const path = usePathname();
	const [activeTab, setActiveTab] = useState("Log Out");
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const permission = 3; // bypass permission check for now

	// Move all hooks to the top, before any conditional logic
	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpenDropdown(null);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Set active tab based on current path
	useEffect(() => {
		if (!permission) return; // Early return in useEffect is fine

		const items: NavItem[] = [
			{
				name: "Check In",
				url: "/scan",
				icon: QrCodeIcon,
				children: [
					{ name: "Scan QR Code", url: "/scan" },
					{ name: "Manual Check In", url: "/manual" },
				].concat(
					permission >= 3
						? [{ name: "Check In Analytics", url: "/scan/analytics" }]
						: []
				),
			},
			{
				name: "Judging",
				url: "/judging",
				icon: GavelIcon,
				children: [{ name: "Judge Projects", url: "/judging" }].concat(
					permission >= 3
						? [{ name: "Analytics", url: "/judging/analytics" }]
						: []
				),
			},
			{ name: "Schedule", url: "/schedule", icon: LucideCalendarDays },
			{ name: "Internal Tools", url: "/tools", icon: LaptopIcon },
			{
				name: "Management",
				url: "/flag",
				icon: ToggleRight,
				children: [{ name: "Flags", url: "/flag" }].concat(
					permission >= 3
						? [
								{ name: "Chat Room (Experimental)", url: "/peerjs" },
								{ name: "Meeting Attendance", url: "/attendance" },
							]
						: []
				),
			},
			{ name: "Log Out", url: "/auth", icon: LogOutIcon, isLogout: true },
		];

		const currentItem = items.find((item) => {
			if (item.children) {
				return item.children.some((child) => path === child.url);
			}
			return path === item.url;
		});

		if (currentItem) {
			setActiveTab(currentItem.name);
		}
	}, [path, permission]);

	// Early return after all hooks have been called
	if (!permission) {
		return null; // Don't render if permission is not available
	}

	const items: NavItem[] = [
		{
			name: "Check In",
			url: "/scan",
			icon: QrCodeIcon,
			children: [
				{ name: "Scan QR Code", url: "/scan" },
				{ name: "Manual Check In", url: "/manual" },
			].concat(
				permission >= 3
					? [{ name: "Check In Analytics", url: "/scan/analytics" }]
					: []
			),
		},
		{
			name: "Judging",
			url: "/judging",
			icon: GavelIcon,
			children: [{ name: "Judge Projects", url: "/judging" }].concat(
				permission >= 3
					? [{ name: "Analytics", url: "/judging/analytics" }]
					: []
			),
		},
		{ name: "Schedule", url: "/schedule", icon: LucideCalendarDays },
		{ name: "Internal Tools", url: "/tools", icon: LaptopIcon },
		{
			name: "Management",
			url: "/flag",
			icon: ToggleRight,
			children: [{ name: "Flags", url: "/flag" }].concat(
				permission >= 3
					? [
							{ name: "Chat Room (Experimental)", url: "/peerjs" },
							{ name: "Meeting Attendance", url: "/attendance" },
						]
					: []
			),
		},
		{ name: "Log Out", url: "/auth", icon: LogOutIcon, isLogout: true },
	];

	const handleItemClick = async (item: NavItem, subItem?: NavSubItem) => {
		if (item.isLogout) {
			await logout();
		}

		if (item.children && !subItem) {
			// Toggle dropdown for items with children
			setOpenDropdown(openDropdown === item.name ? null : item.name);
			return;
		}

		const targetUrl = subItem ? subItem.url : item.url;
		setActiveTab(item.name);
		setOpenDropdown(null);
		router.push(targetUrl);
	};

	const isItemActive = (item: NavItem) => {
		if (item.children) {
			return item.children.some((child) => path === child.url);
		}
		return path === item.url;
	};

	const getActiveSubItem = (item: NavItem) => {
		if (!item.children) return null;
		return item.children.find((child) => path === child.url);
	};

	return (
		<div
			className={cn(
				"fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-6",
				className
			)}
			ref={containerRef}
		>
			{/* Main Navigation */}
			<div className="flex items-center gap-3 bg-background/95 border border-border backdrop-blur-md py-1 px-1 rounded-full shadow-lg">
				{items.map((item) => {
					const Icon = item.icon;
					const isActive = isItemActive(item);
					const activeSubItem = getActiveSubItem(item);
					const hasChildren = item.children && item.children.length > 0;
					const isDropdownOpen = openDropdown === item.name;

					return (
						<div key={item.name} className="relative">
							<button
								onClick={() => handleItemClick(item)}
								className={cn(
									"relative cursor-pointer text-sm font-semibold px-2 py-2 rounded-full transition-colors flex items-center gap-1",
									"text-foreground/80 hover:text-primary",
									isActive && "bg-muted text-primary"
								)}
							>
								{/* Desktop View */}
								<span className="hidden md:flex items-center gap-1">
									<Icon size={16} strokeWidth={2.5} />
									{activeSubItem ? activeSubItem.name : item.name}
									{hasChildren && (
										<ChevronDownIcon
											size={14}
											strokeWidth={2.5}
											className={cn(
												"transition-transform duration-200",
												isDropdownOpen && "rotate-180"
											)}
										/>
									)}
								</span>

								{/* Mobile View - Icon Only */}
								<span className="md:hidden flex items-center gap-1">
									<Icon size={18} strokeWidth={2.5} />
									{hasChildren && (
										<ChevronDownIcon
											size={12}
											strokeWidth={2.5}
											className={cn(
												"transition-transform duration-200",
												isDropdownOpen && "rotate-180"
											)}
										/>
									)}
								</span>

								{/* Active Indicator */}
								{isActive && (
									<motion.div
										layoutId="lamp"
										className="absolute inset-0 w-full bg-primary/20 rounded-full -z-10"
										initial={false}
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 30,
										}}
									/>
								)}
							</button>

							{/* Dropdown Menu - Positioned relative to each item */}
							<AnimatePresence>
								{isDropdownOpen && (
									<motion.div
										initial={{ opacity: 0, y: 10, scale: 0.95 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 10, scale: 0.95 }}
										transition={{ duration: 0.15 }}
										className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 min-w-[180px] z-10"
									>
										<div className="bg-background/95 border border-border backdrop-blur-md rounded-xl shadow-lg py-2">
											{item.children?.map((subItem) => {
												const isSubActive = path === subItem.url;

												return (
													<button
														key={subItem.name}
														onClick={() => handleItemClick(item, subItem)}
														className={cn(
															"w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
															"hover:bg-muted/50",
															isSubActive && "bg-muted text-primary"
														)}
													>
														<span>{subItem.name}</span>
													</button>
												);
											})}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
			</div>
		</div>
	);
}
