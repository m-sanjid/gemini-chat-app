"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  useChatSession,
  useCreateSession,
  useUpdateSession,
  useChatSessions,
} from "@/hooks/useChatHistory";
import ChatSidebar from "./ChatSIdebar";
import Navbar from "./Navbar";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInputBar } from "./ChatInput";
import { Sparkles } from "lucide-react";

export function ChatInterface() {
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<
    string | null
  >("currentSessionId", null);
  const [messages, setMessages] = useLocalStorage<Message[]>("messages", []);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>(
    "sidebarOpen",
    false,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isNewChat, setIsNewChat] = useLocalStorage<boolean>("isNewChat", true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const { refetch: refetchSessions } = useChatSessions();
  const { data: currentSession, isLoading: sessionLoading } = useChatSession(
    currentSessionId || "",
  );
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();

  useEffect(() => {
    if (isNewChat) {
      inputRef.current?.focus();
    }
  }, [isNewChat]);

  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages || []);
      setIsNewChat(false);
    } else {
      setMessages([]);
      setIsNewChat(true);
    }
  }, [currentSession]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const generateSessionTitle = (firstMessage: string): string => {
    const cleaned = firstMessage.trim().replace(/\n+/g, " ");
    if (cleaned.length <= 50) return cleaned;
    return cleaned.substring(0, 47) + "...";
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setCurrentSessionId(null);
    setMessages([]);
    setIsStreaming(false);
    setSidebarOpen(false);
    setIsNewChat(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSessionSelect = (sessionId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
    setIsNewChat(false);
  };

  const verifySession = async (
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/chat/sessions/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Verification failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.success && data.data?.exists;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("Session verification failed:", error);
      return false;
    }
  };

  const verifySessionWithRetry = async (
    sessionId: string,
    maxRetries = 3,
    signal?: AbortSignal,
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (signal?.aborted) {
          throw new Error("Request was aborted");
        }

        const exists = await verifySession(sessionId, signal);
        if (exists) {
          return true;
        }

        if (attempt < maxRetries - 1) {
          const delay = Math.min(200 * Math.pow(2, attempt), 1000);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, delay);
            signal?.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new Error("Request was aborted"));
            });
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }

        console.error(
          `Session verification attempt ${attempt + 1} failed:`,
          error,
        );

        if (attempt === maxRetries - 1) {
          return false;
        }
      }
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const messageContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: "user",
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const currentMessages = messagesRef.current.filter(
        (msg) => msg.content.trim() !== "",
      );
      let sessionId = currentSessionId;

      if (!sessionId || isNewChat) {
        try {
          console.log("Creating new session...");

          const result = await createSessionMutation.mutateAsync({
            title: generateSessionTitle(messageContent),
            firstMessage: {
              id: userMessage.id,
              role: userMessage.role,
              content: userMessage.content,
            },
          });

          if (!result?.id) {
            throw new Error("Failed to create session: No session ID returned");
          }

          sessionId = result.id;
          console.log("Session created with ID:", sessionId);

          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log("Verifying session availability...");
          const sessionExists = await verifySessionWithRetry(
            sessionId,
            5,
            signal,
          );

          if (!sessionExists) {
            throw new Error(
              "Session verification failed after multiple attempts. Please try again.",
            );
          }

          console.log("Session verified successfully");

          setCurrentSessionId(sessionId);
          setIsNewChat(false);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          console.error("Session creation error:", error);
          setMessages((prev) => prev.slice(0, -1));
          setIsStreaming(false);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create new chat session",
          );
          return;
        }
      }

      if (signal.aborted) {
        return;
      }

      if (!isNewChat) {
        const sessionExists = await verifySession(sessionId, signal);
        if (!sessionExists) {
          throw new Error("Session not found. Please start a new chat.");
        }
      }

      console.log("Sending message to API...");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: messageContent,
          history: currentMessages,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || `HTTP error! status: ${response.status}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let hasStartedStreaming = false;

      while (true) {
        if (signal.aborted) {
          reader.cancel();
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (signal.aborted) {
            return;
          }

          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              setIsStreaming(false);

              const updatedMessages = [
                ...currentMessages,
                userMessage,
                { ...assistantMessage, content: fullContent },
              ];

              setMessages((prev) => [
                ...prev.filter((msg) => msg.role === "user"),
                { ...assistantMessage, content: fullContent },
              ]);

              updateSessionMutation
                .mutateAsync({
                  id: sessionId,
                  messages: updatedMessages,
                })
                .then(() => {
                  refetchSessions();
                })
                .catch((updateError) => {
                  console.error("Failed to update session:", updateError);
                  toast.error("Failed to save chat history");
                });
              return;
            }

            if (data && data !== "") {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;

                  if (!hasStartedStreaming) {
                    setMessages((prev) => [
                      ...prev,
                      { ...assistantMessage, content: parsed.content },
                    ]);
                    hasStartedStreaming = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg,
                      ),
                    );
                  }
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
      setMessages((prev) => prev.slice(0, -1));
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsNewChat(true);
    setIsStreaming(false);
  };

  const isLoading =
    isStreaming || sessionLoading || createSessionMutation.isPending;

  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center px-4 py-20">
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: "radial-gradient(circle, rgb(99 102 241 / 0.3) 0%, transparent 70%)",
          }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{
            background: "radial-gradient(circle, rgb(139 92 246 / 0.3) 0%, transparent 70%)",
          }}
        />

        {/* Icon container */}
        <motion.div
          className="relative rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-2xl backdrop-blur-sm"
          whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </div>

      {/* Title and description */}
      <div className="max-w-2xl space-y-6 text-center">
        <h1
          className="bg-linear-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
        >
          Welcome to AI Chat
        </h1>

        <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Start a conversation and explore endless possibilities. Ask me anything—from creative ideas to complex questions.
        </p>

        {/* Suggestion chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {[
            "Explain quantum computing",
            "Write a creative story",
            "Help me code",
            "Plan my day"
          ].map((suggestion, i) => (
            <motion.button
              key={i}
              onClick={() => setInput(suggestion)}
              className="rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 1 + i * 0.1 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-linear-to-br from-background via-background to-muted/20">
      <Navbar
        isSidebarOpen={sidebarOpen}
        isLoading={isLoading}
        clearChat={handleClearChat}
        messages={messages}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
      />

      <div className="flex w-full flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed top-0 h-screen pt-20 -mb-20 border-r z-40 bg-background"
            >
              <ChatSidebar
                currentSessionId={currentSessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
                className="h-[calc(100vh-10rem)] overflow-y-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <motion.div
          className="relative flex w-full min-w-0 flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Messages Area */}
          <div className="relative flex-1 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef} type="auto">
              <div className="flex min-h-full flex-col">
                {messages.length === 0 && !isStreaming ? (
                  <WelcomeScreen />
                ) : (
                  <motion.div
                    className="flex-1 px-4 py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="mx-auto max-w-4xl space-y-6">
                      <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{
                              duration: 0.3,
                              delay: Math.min(index * 0.03, 0.2),
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                            }}
                          >
                            <MessageBubble message={message} />
                          </motion.div>
                        ))}

                        {isStreaming && (
                          <motion.div
                            key="typing"
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{
                              duration: 0.3,
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                            }}
                          >
                            <TypingIndicator />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom padding for better scroll */}
                    <div className="h-8" />
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </div>

          <ChatInputBar
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            handleKeyDown={handleKeyDown}
            inputRef={inputRef}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </div>
  );
}