"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Peer, { type DataConnection } from "peerjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Copy, Send, Users, Wifi, WifiOff, Trash2, User, MessageCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useFirebase } from "@/common/context/FirebaseProvider"

interface Message {
  id: string
  from: string
  fromId: string
  text: string
  timestamp: number
  type: "message" | "system"
}

interface UserInfo {
  id: string
  name: string
  color: string
  actualUserId: string // Store the original Firebase UID
}

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 10)
}

const generateColor = (): string => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const ChatRoomPage: React.FC = () => {
  const { user } = useFirebase()
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connections, setConnections] = useState<DataConnection[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [generatedName] = useState(() => `User${Math.random().toString(36).substring(2, 8).toUpperCase()}`)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<UserInfo[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentPeerId, setCurrentPeerId] = useState<string>("")

  const connsRef = useRef<DataConnection[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userColor = useRef<string>(generateColor())
  const connectedPeerIds = useRef<Set<string>>(new Set())
  const connectionAttempts = useRef<number>(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addSystemMessage = useCallback((text: string) => {
    const systemMessage: Message = {
      id: generateId(),
      from: "System",
      fromId: "system",
      text,
      timestamp: Date.now(),
      type: "system",
    }
    setMessages((prev) => [...prev, systemMessage])
  }, [])

  const generatePeerId = useCallback((baseId: string, attempt = 0): string => {
    if (attempt === 0) {
      return baseId
    }
    // Add timestamp and attempt number to make it unique
    return `${baseId}-${Date.now()}-${attempt}`
  }, [])

  const setupPeer = useCallback(
    (attemptNumber = 0) => {
      if (!user?.uid) {
        addSystemMessage("Please authenticate to join the chat")
        return
      }

      setIsConnecting(true)
      connectionAttempts.current = attemptNumber

      const peerId = generatePeerId(user.uid, attemptNumber)
      setCurrentPeerId(peerId)

      if (attemptNumber > 0) {
        addSystemMessage(`Connection attempt ${attemptNumber + 1} - trying with ID: ${peerId}`)
      }

      const p = new Peer(peerId, {
        host: "peerjs.hackpsu.org",
        port: 443,
        path: "/peerjs",
        secure: true,
        debug: 1,
      })

      setPeer(p)

      p.on("open", () => {
        setIsConnected(true)
        setIsConnecting(false)
        connectionAttempts.current = 0

        if (attemptNumber > 0) {
          addSystemMessage(`Successfully connected with new ID after ${attemptNumber + 1} attempts`)
        } else {
          addSystemMessage(`Connected as ${generatedName}`)
        }

        // Find and connect to all other peers
        p.listAllPeers((all) => {
          // Filter out our own variations (in case we have multiple IDs)
          const others = all.filter((pid) => {
            const isOwnId = pid === peerId || pid.startsWith(user.uid)
            return !isOwnId && !connectedPeerIds.current.has(pid)
          })

          if (others.length > 0) {
            addSystemMessage(`Found ${others.length} peer(s), connecting...`)
            others.forEach((remoteId) => {
              if (!connectedPeerIds.current.has(remoteId)) {
                connectedPeerIds.current.add(remoteId)
                const c = p.connect(remoteId)
                setupConnection(c)
              }
            })
          } else {
            addSystemMessage("No other peers found. Waiting for connections...")
          }
        })
      })

      p.on("connection", (c) => {
        if (c.peer && !connectedPeerIds.current.has(c.peer)) {
          connectedPeerIds.current.add(c.peer)
          setupConnection(c)
          addSystemMessage(`New peer connected`)
        }
      })

      p.on("error", (err) => {
        console.error("Peer error:", err)
        setIsConnecting(false)

        // Handle "unavailable-id" error by retrying with a new ID
        if (err.type === "unavailable-id") {
          if (attemptNumber < 3) {
            // Limit retry attempts
            toast.error(`ID taken, retrying with new ID...`)
            addSystemMessage(`ID ${peerId} is taken, generating new ID...`)

            // Clean up current peer
            p.destroy()

            // Retry with incremented attempt number
            setTimeout(() => {
              setupPeer(attemptNumber + 1)
            }, 1000)
          } else {
            toast.error("Failed to connect after multiple attempts")
            addSystemMessage("Failed to connect after multiple attempts. Please try again later.")
          }
        } else {
          toast.error(`Connection Error: ${err.message}`)
          addSystemMessage(`Connection error: ${err.message}`)
        }
      })

      p.on("disconnected", () => {
        setIsConnected(false)
        addSystemMessage("Disconnected from server")
      })
    },
    [user?.uid, generatedName, generatePeerId],
  )

  const setupConnection = useCallback(
    (c: DataConnection) => {
      let isConnectionOpen = false

      c.on("open", () => {
        isConnectionOpen = true
        connsRef.current.push(c)
        setConnections([...connsRef.current])

        try {
          c.send({
            type: "user_info",
            user: {
              id: currentPeerId,
              name: generatedName,
              color: userColor.current,
              actualUserId: user?.uid || "unknown", // Send the original Firebase UID
            },
          })
        } catch (error) {
          console.error("Failed to send user info:", error)
        }
      })

      c.on("data", (data: any) => {
        if (data.type === "chat") {
          const newMessage: Message = {
            id: generateId(),
            from: data.user?.name || data.from || "Unknown",
            fromId: data.user?.actualUserId || data.user?.id || data.from || "unknown",
            text: data.text,
            timestamp: data.timestamp || Date.now(),
            type: "message",
          }
          setMessages((prev) => [...prev, newMessage])
        } else if (data.type === "user_info") {
          setConnectedUsers((prev) => {
            // Check if we already have this actual user (by Firebase UID)
            const existingIndex = prev.findIndex((u) => u.actualUserId === data.user.actualUserId)

            if (existingIndex >= 0) {
              // Replace the existing user info with the new one
              const updated = [...prev]
              updated[existingIndex] = data.user
              addSystemMessage(`${data.user.name} reconnected with new session`)
              return updated
            } else {
              // Add new user
              return [...prev, data.user]
            }
          })
        }
      })

      c.on("close", () => {
        isConnectionOpen = false
        connsRef.current = connsRef.current.filter((x) => x !== c)
        setConnections([...connsRef.current])

        if (c.peer) {
          connectedPeerIds.current.delete(c.peer)
        }
        addSystemMessage("A peer disconnected")
      })

      c.on("error", (err) => {
        console.error("Connection error:", err)
        isConnectionOpen = false
        if (c.peer) {
          connectedPeerIds.current.delete(c.peer)
        }
      })
      ;(c as any).isConnectionOpen = () => isConnectionOpen
    },
    [currentPeerId, user?.uid, generatedName],
  )

  const sendMessage = useCallback(() => {
    if (!input.trim() || !peer || !user?.uid) return

    const messageData = {
      type: "chat",
      text: input,
      timestamp: Date.now(),
      user: {
        id: currentPeerId,
        name: generatedName,
        color: userColor.current,
        actualUserId: user.uid,
      },
    }

    connsRef.current.forEach((c) => {
      try {
        if ((c as any).isConnectionOpen && (c as any).isConnectionOpen()) {
          c.send(messageData)
        }
      } catch (error) {
        console.error("Failed to send message to peer:", error)
      }
    })

    const newMessage: Message = {
      id: generateId(),
      from: "You",
      fromId: user.uid,
      text: input,
      timestamp: Date.now(),
      type: "message",
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
  }, [input, peer, user?.uid, generatedName, currentPeerId])

  const copyPeerId = useCallback(() => {
    if (currentPeerId) {
      navigator.clipboard.writeText(currentPeerId)
      toast.success("Peer ID copied to clipboard")
    }
  }, [currentPeerId])

  const clearChat = useCallback(() => {
    setMessages([])
    toast.success("Chat cleared")
  }, [])

  const forceReconnect = useCallback(() => {
    if (peer) {
      peer.destroy()
      setPeer(null)
      setConnections([])
      setConnectedUsers([])
      setIsConnected(false)
      connsRef.current = []
      connectedPeerIds.current.clear()
      addSystemMessage("Force reconnecting...")

      // Start fresh connection
      setTimeout(() => {
        setupPeer(0)
      }, 1000)
    }
  }, [peer, setupPeer, addSystemMessage])

  const disconnect = useCallback(() => {
    if (peer) {
      peer.destroy()
      setPeer(null)
      setConnections([])
      setConnectedUsers([])
      setIsConnected(false)
      setMessages([])
      connsRef.current = []
      connectedPeerIds.current.clear()
      setCurrentPeerId("")
      addSystemMessage("Disconnected")
    }
  }, [peer, addSystemMessage])

  useEffect(() => {
    if (user?.uid) {
      setupPeer(0)
    } else {
      if (peer) {
        peer.destroy()
        setPeer(null)
        setConnections([])
        setConnectedUsers([])
        setIsConnected(false)
        setMessages([])
        connsRef.current = []
        connectedPeerIds.current.clear()
        setCurrentPeerId("")
        addSystemMessage("Disconnected")
      }
    }
  }, [user?.uid])

  if (!user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Please sign in to join the chat room.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Chat Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
              <span className="text-sm">
                {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
              </span>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{generatedName}</span>
              </div>
              <div className="text-xs text-muted-foreground">ID: {currentPeerId || "Not connected"}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyPeerId} className="text-xs bg-transparent">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy ID
                </Button>
              </div>
            </div>

            <Separator />

            {/* Connected Peers */}
            <div>
              <h4 className="text-sm font-medium mb-2">Connected ({connections.length})</h4>
              <div className="space-y-1">
                {connectedUsers.map((connectedUser) => (
                  <div key={connectedUser.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={`${connectedUser.color} text-white text-xs`}>
                        {connectedUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{connectedUser.name}</span>
                  </div>
                ))}
                {connections.length === 0 && <p className="text-xs text-muted-foreground">No peers connected</p>}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={clearChat} className="w-full text-xs bg-transparent">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Chat
              </Button>
              <Button variant="outline" size="sm" onClick={forceReconnect} className="w-full text-xs bg-transparent">
                <RefreshCw className="h-3 w-3 mr-1" />
                Force Reconnect
              </Button>
              <Button variant="destructive" size="sm" onClick={disconnect} className="w-full text-xs">
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>PeerJS Chat Room</span>
              <Badge variant="secondary">
                {connections.length} peer{connections.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-3 py-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    {message.type === "system" ? (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {message.text}
                        </Badge>
                      </div>
                    ) : (
                      <div className={`flex gap-3 ${message.from === "You" ? "justify-end" : "justify-start"}`}>
                        {message.from !== "You" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-gray-500 text-white text-sm">
                              {message.from.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${message.from === "You" ? "order-first" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{message.from}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                          </div>
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              message.from === "You" ? "bg-blue-500 text-white ml-auto" : "bg-gray-100"
                            }`}
                          >
                            <p className="text-sm break-words">{message.text}</p>
                          </div>
                        </div>
                        {message.from === "You" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-blue-500 text-white text-sm">
                              {message.from.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {isConnecting ? "Connecting to chat room..." : "No messages yet. Start the conversation!"}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={!isConnected}
                  className="flex-1"
                  maxLength={500}
                />
                <Button type="submit" disabled={!input.trim() || !isConnected} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ChatRoomPage
