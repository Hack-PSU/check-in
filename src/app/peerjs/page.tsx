"use client";

import type React from "react";
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	type ChangeEvent,
} from "react";
import Peer, { type DataConnection } from "peerjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Copy,
	Send,
	Users,
	Wifi,
	WifiOff,
	Trash2,
	User,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/common/context/FirebaseProvider";
import { useAllUsers } from "@/common/api/user/hook";
import { useAllOrganizers } from "@/common/api/organizer/hook";

// --- Constants ---
const ROOM_ID = "global-chat-room"; // Namespace for this chat room
const MAX_LOCAL_HISTORY = 200;
const TYPING_TIMEOUT = 2000; // 2 seconds
const LOCAL_STORAGE_WRITE_DEBOUNCE = 500; // ms

// --- Types ---
interface Message {
	id: string;
	from: string;
	fromId: string; // The persistent Firebase UID
	text: string;
	timestamp: number;
	type: "message" | "system";
}

interface UserInfo {
	id: string; // The current PeerJS ID (can be temporary)
	name: string;
	color: string;
	actualUserId: string; // The persistent Firebase UID
}

type ConnectionStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "error"
	| "retrying";

// --- Utility Functions ---
const generateId = (): string => crypto.randomUUID();
const generateColor = (): string => {
	const colors = [
		"bg-red-500",
		"bg-blue-500",
		"bg-green-500",
		"bg-yellow-500",
		"bg-purple-500",
		"bg-pink-500",
	];
	return colors[Math.floor(Math.random() * colors.length)];
};
const formatTime = (timestamp: number): string =>
	new Date(timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

// --- Main Component ---
const ChatRoomPage: React.FC = () => {
	const { user } = useFirebase();
	const { data: allUsers, isLoading: areUsersLoading } = useAllUsers();
	const { data: allOrganizers, isLoading: areOrganizersLoading } =
		useAllOrganizers();

	const peopleMap = useMemo(() => {
		const newMap = new Map<string, { firstName: string; lastName: string }>();
		if (allUsers) {
			allUsers.forEach((u) =>
				newMap.set(u.id, { firstName: u.firstName, lastName: u.lastName })
			);
		}
		if (allOrganizers) {
			allOrganizers.forEach((o) =>
				newMap.set(o.id, { firstName: o.firstName, lastName: o.lastName })
			);
		}
		return newMap;
	}, [allUsers, allOrganizers]);

	const currentUserInfo = user?.uid ? peopleMap.get(user.uid) : null;
	const displayName = currentUserInfo
		? `${currentUserInfo.firstName} ${currentUserInfo.lastName}`
		: user?.uid
			? "Loading..."
			: "Disconnected";

	// --- State ---
	const [messages, setMessages] = useState<Message[]>(() => {
		if (typeof window === "undefined") return [];
		try {
			const saved = localStorage.getItem(`peer-chat-history-${ROOM_ID}`);
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	});
	const [input, setInput] = useState("");
	const [connectedUsers, setConnectedUsers] = useState<Map<string, UserInfo>>(
		new Map()
	);
	const [typingUsers, setTypingUsers] = useState<Map<string, { name: string }>>(
		new Map()
	);
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatus>("disconnected");
	const [currentPeerId, setCurrentPeerId] = useState<string>("");

	// --- Refs for stable closures and avoiding re-renders ---
	const peerRef = useRef<Peer | null>(null);
	const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
	const messagesRef = useRef(messages);
	const userRef = useRef(user);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isTypingRef = useRef(false);
	const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const historySentPeersRef = useRef<Set<string>>(new Set());
	const localStorageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const [userColor] = useState(() => generateColor());

	// Keep refs in sync with state
	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	useEffect(() => {
		userRef.current = user;
	}, [user]);

	// --- Effects ---
	const messagesEndRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, typingUsers]);

	useEffect(() => {
		if (localStorageTimeoutRef.current) {
			clearTimeout(localStorageTimeoutRef.current);
		}
		localStorageTimeoutRef.current = setTimeout(() => {
			try {
				const cappedHistory = messages.slice(-MAX_LOCAL_HISTORY);
				localStorage.setItem(
					`peer-chat-history-${ROOM_ID}`,
					JSON.stringify(cappedHistory)
				);
			} catch (error) {
				console.error("Failed to save messages to localStorage", error);
			}
		}, LOCAL_STORAGE_WRITE_DEBOUNCE);
	}, [messages]);

	// Effect to broadcast profile info updates when the display name changes
	useEffect(() => {
		if (connectionStatus === "connected" && currentUserInfo && user?.uid) {
			broadcast({
				type: "user_info",
				payload: {
					id: currentPeerId,
					name: displayName,
					color: userColor,
					actualUserId: user.uid,
				},
			});
		}
	}, [displayName, connectionStatus, user?.uid, currentPeerId, userColor]);

	// Main connection effect - depends only on user.uid
	useEffect(() => {
		if (!user?.uid) {
			if (peerRef.current) {
				peerRef.current.destroy();
			}
			return;
		}

		let peer: Peer | null = null;
		let connectionAttempts = 0;

		const connect = () => {
			if (peerRef.current) {
				peerRef.current.destroy();
			}
			connectionsRef.current.clear();
			setConnectedUsers(new Map());
			setTypingUsers(new Map());
			historySentPeersRef.current.clear();
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}

			setConnectionStatus(connectionAttempts === 0 ? "connecting" : "retrying");
			const peerId = `${ROOM_ID}_${user.uid}_${generateId().substring(0, 8)}`;
			setCurrentPeerId(peerId);

			peer = new Peer(peerId, {
				host: "peerjs.hackpsu.org",
				port: 443,
				path: "/peerjs",
				secure: true,
				debug: 1,
			});
			peerRef.current = peer;

			peer.on("open", handleOpen);
			peer.on("connection", handleConnection);
			peer.on("error", handleError);
			peer.on("disconnected", handleDisconnected);
			peer.on("close", handleClose);
		};

		const rebuildMesh = (peerInstance: Peer, currentId: string) => {
			peerInstance.listAllPeers((allPeers) => {
				const otherPeersInRoom = allPeers.filter(
					(pId) => pId.startsWith(`${ROOM_ID}_`) && pId !== currentId
				);
				if (otherPeersInRoom.length > 0) {
					addSystemMessage(
						`Found ${otherPeersInRoom.length} other peer(s). Rebuilding connections...`
					);
					otherPeersInRoom.forEach((pId) => setupConnection(pId));
				}
			});
		};

		const handleOpen = (id: string) => {
			setConnectionStatus("connected");
			connectionAttempts = 0;
			addSystemMessage(`You have connected.`);
			if (peer) {
				rebuildMesh(peer, id);
			}
		};

		const handleConnection = (conn: DataConnection) => {
			addSystemMessage(`Incoming connection from a peer.`);
			setupDataConnection(conn);
		};

		const handleError = (err: any) => {
			console.error("PeerJS error:", err);
			const maxRetries = 3;
			const retryableErrors = [
				"network",
				"server-error",
				"webrtc",
				"unavailable-id",
			];
			if (retryableErrors.includes(err.type)) {
				connectionAttempts++;
				if (connectionAttempts <= maxRetries) {
					const delay = Math.pow(2, connectionAttempts) * 1000;
					toast.error(`Connection error. Retrying in ${delay / 1000}s...`);
					setConnectionStatus("retrying");
					retryTimeoutRef.current = setTimeout(connect, delay);
				} else {
					toast.error("Failed to connect after multiple attempts.");
					setConnectionStatus("error");
				}
			} else {
				toast.error(`An unrecoverable error occurred: ${err.message}`);
				setConnectionStatus("error");
			}
		};

		const handleDisconnected = () => {
			toast.warning(
				"Disconnected from PeerJS server. Attempting to reconnect..."
			);
			setConnectionStatus("retrying");
			if (peerRef.current && !peerRef.current.destroyed) {
				peerRef.current.reconnect();
			}
		};

		const handleClose = () => {
			addSystemMessage("Peer connection closed.");
			setConnectionStatus("disconnected");
		};

		const setupConnection = (peerId: string) => {
			if (connectionsRef.current.has(peerId) || !peer) return;
			const conn = peer.connect(peerId, { reliable: true, label: displayName });
			setupDataConnection(conn);
		};

		const setupDataConnection = (conn: DataConnection) => {
			conn.on("open", () => {
				connectionsRef.current.set(conn.peer, conn);
				conn.send({
					type: "user_info",
					payload: {
						id: currentPeerId,
						name: displayName,
						color: userColor,
						actualUserId: user.uid,
					},
				});
				conn.send({ type: "history_request" });
			});

			conn.on("data", (data: any) => handleData(data, conn));
			conn.on("close", () => handleConnectionClose(conn.peer));
			conn.on("error", (err) => {
				console.error(`Connection error with ${conn.peer}:`, err);
				handleConnectionClose(conn.peer);
			});
		};

		const handleData = (data: any, conn: DataConnection) => {
			switch (data.type) {
				case "user_info":
					setConnectedUsers((prev) =>
						new Map(prev).set(conn.peer, data.payload)
					);
					break;
				case "history_request":
					if (!historySentPeersRef.current.has(conn.peer)) {
						const chatHistory = messagesRef.current
							.filter((m) => m.type === "message")
							.slice(-50);
						conn.send({ type: "history_response", payload: chatHistory });
						historySentPeersRef.current.add(conn.peer);
					}
					break;
				case "history_response":
					setMessages((prev) => {
						const messageMap = new Map(prev.map((m) => [m.id, m]));
						data.payload.forEach((m: Message) => {
							if (!messageMap.has(m.id)) messageMap.set(m.id, m);
						});
						return Array.from(messageMap.values()).sort(
							(a, b) => a.timestamp - b.timestamp
						);
					});
					break;
				case "typing_start":
					setTypingUsers((prev) =>
						new Map(prev).set(data.payload.id, { name: data.payload.name })
					);
					break;
				case "typing_stop":
					setTypingUsers((prev) => {
						const newMap = new Map(prev);
						newMap.delete(data.payload.id);
						return newMap;
					});
					break;
				case "chat":
					setMessages((prev) => [...prev, data.payload]);
					break;
			}
		};

		const handleConnectionClose = (peerId: string) => {
			connectionsRef.current.delete(peerId);
			historySentPeersRef.current.delete(peerId);
			setConnectedUsers((prev) => {
				const newMap = new Map(prev);
				const user = newMap.get(peerId);
				if (user) addSystemMessage(`${user.name} has disconnected.`);
				newMap.delete(peerId);
				return newMap;
			});
			setTypingUsers((prev) => {
				const newMap = new Map(prev);
				newMap.delete(peerId);
				return newMap;
			});
		};

		connect();

		return () => {
			if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
			if (localStorageTimeoutRef.current)
				clearTimeout(localStorageTimeoutRef.current);
			if (peerRef.current) {
				peerRef.current.destroy();
				peerRef.current = null;
			}
		};
	}, [user?.uid]);

	const addSystemMessage = useCallback((text: string) => {
		const systemMessage: Message = {
			id: generateId(),
			from: "System",
			fromId: "system",
			text,
			timestamp: Date.now(),
			type: "system",
		};
		setMessages((prev) => [...prev, systemMessage]);
	}, []);

	const broadcast = (data: any) => {
		for (const conn of connectionsRef.current.values()) {
			if (conn.open) {
				conn.send(data);
			}
		}
	};

	const sendMessage = () => {
		if (!input.trim() || !userRef.current?.uid) return;
		const message: Message = {
			id: generateId(),
			from: displayName,
			fromId: userRef.current.uid,
			text: input,
			timestamp: Date.now(),
			type: "message",
		};
		setMessages((prev) => [...prev, message]);
		broadcast({ type: "chat", payload: message });
		setInput("");
		if (isTypingRef.current) {
			broadcast({ type: "typing_stop", payload: { id: currentPeerId } });
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
			isTypingRef.current = false;
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
		if (!isTypingRef.current) {
			isTypingRef.current = true;
			broadcast({
				type: "typing_start",
				payload: { id: currentPeerId, name: displayName },
			});
		}
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			broadcast({ type: "typing_stop", payload: { id: currentPeerId } });
			isTypingRef.current = false;
		}, TYPING_TIMEOUT);
	};

	const clearChat = useCallback(() => {
		setMessages([]);
		localStorage.removeItem(`peer-chat-history-${ROOM_ID}`);
		historySentPeersRef.current.clear();
		broadcast({ type: "history_request" });
		toast.success("Chat history cleared. Re-syncing from network.");
	}, []);

	const forceReconnect = useCallback(() => {
		if (peerRef.current) {
			peerRef.current.destroy();
		}
	}, []);

	if (!user?.uid || areUsersLoading || areOrganizersLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle>Loading Profile Data...</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Please wait while we get things ready.</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const statusInfo = {
		disconnected: {
			text: "Disconnected",
			color: "text-red-500",
			icon: <WifiOff />,
		},
		connecting: {
			text: "Connecting...",
			color: "text-yellow-500",
			icon: <Wifi />,
		},
		retrying: {
			text: "Retrying...",
			color: "text-yellow-500",
			icon: <RefreshCw className="animate-spin" />,
		},
		connected: { text: "Connected", color: "text-green-500", icon: <Wifi /> },
		error: {
			text: "Connection Failed",
			color: "text-red-500",
			icon: <WifiOff />,
		},
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-2rem)]">
				<Card className="lg:col-span-1">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Users className="h-5 w-5" /> Chat Info
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div
							className={`flex items-center gap-2 font-medium ${statusInfo[connectionStatus].color}`}
						>
							{statusInfo[connectionStatus].icon}
							<span>{statusInfo[connectionStatus].text}</span>
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4" />
								<span className="text-sm font-medium">{displayName}</span>
							</div>
							<div className="text-xs text-muted-foreground truncate">
								ID: {currentPeerId}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigator.clipboard.writeText(currentPeerId)}
								className="text-xs bg-transparent"
							>
								<Copy className="h-3 w-3 mr-1" /> Copy ID
							</Button>
						</div>
						<Separator />
						<div>
							<h4 className="text-sm font-medium mb-2">
								Connected ({connectedUsers.size})
							</h4>
							<div className="space-y-1">
								{Array.from(connectedUsers.values()).map((u) => (
									<div key={u.id} className="flex items-center gap-2">
										<Avatar className="h-6 w-6">
											<AvatarFallback
												className={`${u.color} text-white text-xs`}
											>
												{u.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<span className="text-xs">{u.name}</span>
									</div>
								))}
							</div>
						</div>
						<Separator />
						<div className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								onClick={clearChat}
								className="w-full text-xs bg-transparent"
							>
								<Trash2 className="h-3 w-3 mr-1" /> Clear Chat
							</Button>
							{connectionStatus === "error" ||
							connectionStatus === "retrying" ? (
								<Button
									variant="outline"
									size="sm"
									onClick={forceReconnect}
									className="w-full text-xs bg-transparent"
								>
									<RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
								</Button>
							) : null}
						</div>
					</CardContent>
				</Card>
				<Card className="lg:col-span-3 flex flex-col">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center justify-between">
							<span>PeerJS Chat Room</span>
							<Badge variant="secondary">{connectedUsers.size} peers</Badge>
						</CardTitle>
					</CardHeader>
					<div className="px-4 pb-2 h-6 text-xs text-muted-foreground italic">
						{typingUsers.size > 0 ? (
							`${Array.from(typingUsers.values())
								.map((u) => u.name)
								.join(", ")} is typing...`
						) : (
							<>&nbsp;</>
						)}
					</div>
					<CardContent className="flex-1 flex flex-col p-0">
						<ScrollArea className="flex-1 px-4">
							<div className="space-y-3 py-4">
								{messages.map((message) => {
									const isMine = message.fromId === user?.uid;
									return (
										<div key={message.id} className="space-y-1">
											{message.type === "system" ? (
												<div className="text-center">
													<Badge variant="outline" className="text-xs">
														{message.text}
													</Badge>
												</div>
											) : (
												<div
													className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}
												>
													{!isMine && (
														<Avatar className="h-8 w-8 mt-1">
															<AvatarFallback className="bg-gray-500 text-white text-sm">
																{message.from.charAt(0)}
															</AvatarFallback>
														</Avatar>
													)}
													<div
														className={`max-w-[70%] ${isMine ? "order-first" : ""}`}
													>
														<div className="flex items-center gap-2 mb-1">
															<span className="text-sm font-medium">
																{isMine ? "You" : message.from}
															</span>
															<span className="text-xs text-muted-foreground">
																{formatTime(message.timestamp)}
															</span>
														</div>
														<div
															className={`rounded-lg px-3 py-2 ${isMine ? "bg-blue-500 text-white" : "bg-gray-100"}`}
														>
															<p className="text-sm break-words">
																{message.text}
															</p>
														</div>
													</div>
													{isMine && (
														<Avatar className="h-8 w-8 mt-1">
															<AvatarFallback
																className={`${userColor} text-white text-sm`}
															>
																{displayName.charAt(0)}
															</AvatarFallback>
														</Avatar>
													)}
												</div>
											)}
										</div>
									);
								})}
								<div ref={messagesEndRef} />
							</div>
						</ScrollArea>
						<div className="border-t p-4">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									sendMessage();
								}}
								className="flex gap-2"
							>
								<Input
									value={input}
									onChange={handleInputChange}
									placeholder="Type your message..."
									disabled={connectionStatus !== "connected"}
									className="flex-1"
								/>
								<Button
									type="submit"
									disabled={!input.trim() || connectionStatus !== "connected"}
									size="icon"
								>
									<Send className="h-4 w-4" />
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default ChatRoomPage;
