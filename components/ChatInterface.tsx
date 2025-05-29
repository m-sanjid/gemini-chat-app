"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
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

  // Focus input when component mounts or when starting a new chat
  useEffect(() => {
    if (isNewChat) {
      inputRef.current?.focus();
    }
  }, [isNewChat]);

  // Load session messages when current session changes
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages || []);
      setIsNewChat(false);
    } else {
      setMessages([]);
      setIsNewChat(true);
    }
  }, [currentSession]);

  // Cleanup on unmount
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
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setCurrentSessionId(null);
    setMessages([]);
    setIsStreaming(false);
    setSidebarOpen(false);
    setIsNewChat(true);
    // Focus input after state updates
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSessionSelect = (sessionId: string) => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
    setIsNewChat(false);
  };

  // Simplified session verification with better error handling
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
        throw error; // Re-throw abort errors
      }
      console.error("Session verification failed:", error);
      return false;
    }
  };

  // Enhanced session verification with exponential backoff and abort signal
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

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries - 1) {
          const delay = Math.min(200 * Math.pow(2, attempt), 1000); // 200ms, 400ms, 800ms max
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

    // Create new abort controller for this request
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

    // Add user message immediately and start streaming
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const currentMessages = messagesRef.current.filter(
        (msg) => msg.content.trim() !== "",
      );
      let sessionId = currentSessionId;

      // Create new session if needed
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

          // Wait for session to be available in the database
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Verify session with retry logic and abort signal
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

          // Only update state after successful verification
          setCurrentSessionId(sessionId);
          setIsNewChat(false);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return; // Request was cancelled, don't show error
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

      // Check if request was aborted before proceeding
      if (signal.aborted) {
        return;
      }

      // Verify existing session before sending message
      if (!isNewChat) {
        const sessionExists = await verifySession(sessionId, signal);
        if (!sessionExists) {
          throw new Error("Session not found. Please start a new chat.");
        }
      }

      console.log("Sending message to API...");

      // Send message to API
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

              // Update final message
              setMessages((prev) => [
                ...prev.filter((msg) => msg.role === "user"),
                { ...assistantMessage, content: fullContent },
              ]);

              // Update session in background, don't wait for it
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

                  // Add assistant message on first chunk
                  if (!hasStartedStreaming) {
                    setMessages((prev) => [
                      ...prev,
                      { ...assistantMessage, content: parsed.content },
                    ]);
                    hasStartedStreaming = true;
                  } else {
                    // Update streaming message
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
        return; // Request was cancelled, don't show error
      }

      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
      setMessages((prev) => prev.slice(0, -1));
      setIsStreaming(false);
    }
  };

  // Changed onKeyPress to onKeyDown to avoid React warning
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

  // Welcome screen component
  const WelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mt-10 flex h-full flex-col items-center justify-center"
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="from-primary/20 to-primary/10 absolute inset-0 rounded-full bg-gradient-to-r blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="from-primary/20 to-primary/5 border-primary/10 relative rounded-full border bg-gradient-to-br p-6 backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="text-primary h-12 w-12" />
        </motion.div>
      </motion.div>

      <motion.div
        className="max-w-md space-y-4 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.h1
          className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Welcome to AI Chat
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          Start a conversation and explore the possibilities. Ask me anything
          about any topic.
        </motion.p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="from-background via-background to-background/95 flex h-screen flex-col bg-gradient-to-br">
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
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed z-50 h-full w-80 flex-shrink-0 md:relative md:translate-x-0"
            >
              <motion.div
                className="bg-card/95 border-border/50 h-full border-r shadow-xl backdrop-blur-xl md:shadow-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <ChatSidebar
                  currentSessionId={currentSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewChat={handleNewChat}
                  className="h-full"
                />
              </motion.div>
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
                    className="flex-1 px-4 py-6"
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
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{
                              duration: 0.3,
                              delay: Math.min(index * 0.05, 0.3),
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                          >
                            <MessageBubble message={message} />
                          </motion.div>
                        ))}

                        {/* Typing Indicator */}
                        {isStreaming && (
                          <motion.div
                            key="typing"
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{
                              duration: 0.3,
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                          >
                            <TypingIndicator />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border-border/50 bg-background/95 border-t backdrop-blur-xl"
          >
            <div className="mx-auto max-w-4xl p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative"
              >
                <motion.div
                  className="border-border/50 bg-card/50 focus-within:ring-primary/20 focus-within:border-primary/50 relative rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-200 focus-within:ring-2 hover:shadow-xl"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className={cn(
                      "placeholder:text-muted-foreground/60 min-h-[56px] resize-none border-0 bg-transparent pr-14 text-base focus-visible:ring-0 focus-visible:ring-offset-0",
                      "rounded-2xl px-6 py-4",
                      isLoading && "cursor-not-allowed opacity-50",
                    )}
                    autoFocus
                  />

                  <motion.div
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading || input.trim() === ""}
                      className={cn(
                        "h-10 w-10 rounded-xl shadow-md",
                        "bg-primary hover:bg-primary/90",
                        "transition-all duration-200",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      size="icon"
                    >
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ scale: 0, rotate: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="send"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Send className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Input hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground/60 mt-2 text-center text-xs"
                >
                  Press Enter to send, Shift + Enter for new line
                </motion.p>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
