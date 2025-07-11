"use client";

import React, { useState, useEffect } from "react";
import Peer, { DataConnection } from "peerjs";

// Generate a browser-friendly UUID for PeerJS
const generateId = (): string => {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	// fallback for environments without randomUUID
	return Math.random().toString(36).substring(2, 10);
};

const TicTacToePage: React.FC = () => {
	const [peer, setPeer] = useState<Peer | null>(null);
	const [conn, setConn] = useState<DataConnection | null>(null);
	const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
	const [myTurn, setMyTurn] = useState(false);
	const [isInitiator, setIsInitiator] = useState(false);
	const [status, setStatus] = useState("Initializing...");

	useEffect(() => {
		const peerId = generateId();
		const p = new Peer(peerId, {
			host: "peerjs.hackpsu.org",
			port: 443,
			path: "/peerjs",
			secure: true,
			debug: 2,
			// config: { iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ] }
		});
		setPeer(p);

		p.on("error", (err) => {
			console.error("Peer error:", err);
			setStatus(`Error: ${err.type}`);
		});

		p.on("open", (id) => {
			setStatus(`Connected as ${id}. Looking for opponent...`);
			p.listAllPeers((peers: string[]) => {
				const others = peers.filter((pid) => pid !== id);
				if (others.length > 0) {
					const opponentId = others[Math.floor(Math.random() * others.length)];
					setStatus(`Connecting to ${opponentId}...`);
					const c = p.connect(opponentId);
					setIsInitiator(true);
					setupConnection(c);
				} else {
					setStatus("Waiting for opponent...");
				}
			});
		});

		p.on("connection", (c) => {
			if (!conn) {
				setIsInitiator(false);
				setupConnection(c);
				setStatus("Opponent connected! Opponent's turn (X)");
			}
		});

		return () => p.destroy();
	}, []);

	const setupConnection = (c: DataConnection) => {
		c.on("open", () => {
			setConn(c);
			if (isInitiator) {
				setMyTurn(true);
				setStatus("Game started! Your turn (X)");
			} else {
				setMyTurn(false);
				setStatus("Game started! Opponent's turn (X)");
			}
		});

		c.on("data", (data: any) => {
			if (data.type === "move") {
				setBoard((prev) => {
					const newBoard = [...prev];
					newBoard[data.idx] = isInitiator ? "O" : "X";
					return newBoard;
				});
				setMyTurn(true);
				setStatus(`Your turn (${isInitiator ? "X" : "O"})`);
			}
		});

		c.on("error", (err) => {
			console.error("Connection error:", err);
			setStatus("Connection error");
		});
	};

	const handleClick = (idx: number) => {
		if (!myTurn || board[idx] || !conn) return;
		const symbol = isInitiator ? "X" : "O";
		setBoard((prev) => {
			const newBoard = [...prev];
			newBoard[idx] = symbol;
			return newBoard;
		});
		conn.send({ type: "move", idx });
		setMyTurn(false);
		setStatus(`Opponent's turn (${isInitiator ? "O" : "X"})`);
	};

	return (
		<div className="flex flex-col items-center p-4">
			<h2 className="mb-4">{status}</h2>
			<div className="grid grid-cols-3 gap-1">
				{board.map((cell, idx) => (
					<button
						key={idx}
						className="w-20 h-20 text-3xl font-bold border"
						onClick={() => handleClick(idx)}
					>
						{cell}
					</button>
				))}
			</div>
		</div>
	);
};

export default TicTacToePage;
