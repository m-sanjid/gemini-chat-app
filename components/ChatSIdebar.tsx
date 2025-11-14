"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  MoreHorizontal,
  Edit,
  Loader2,
  FolderX,
  Search,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import { cn, truncate } from "@/lib/utils";
import {
  useChatSessions,
  useCreateSession,
  useDeleteSession,
  useClearAllChats,
  useUpdateSession,
} from "@/hooks/useChatHistory";
import { ChatSession } from "@/types/chat";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  className?: string;
}

export default function ChatSidebar({
  currentSessionId,
  onSessionSelect,
  onNewChat,
  className,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const { data: sessions = [], isLoading } = useChatSessions();
  const createSessionMutation = useCreateSession();
  const deleteSessionMutation = useDeleteSession();
  const clearAllMutation = useClearAllChats();
  const updateSessionMutation = useUpdateSession();

  const filteredSessions =
    sessions?.filter(
      (s) =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages?.some((m) =>
          m.content?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ) ?? [];

  const handleNewChat = async () => {
    const session = await createSessionMutation.mutateAsync({
      title: "New Chat",
    });
    onSessionSelect(session.id);
    onNewChat();
  };

  const handleDeleteChat = async (id: string) => {
    await deleteSessionMutation.mutateAsync(id);
    if (currentSessionId === id) onNewChat();
  };

  const handleClearAllChats = async () => {
    await clearAllMutation.mutateAsync();
    onNewChat();
  };

  const handleEditTitle = (s: ChatSession) => {
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const handleSaveTitle = async () => {
    if (!editingId || !editTitle.trim()) return;
    await updateSessionMutation.mutateAsync({
      id: editingId,
      title: editTitle.trim(),
    });
    setEditingId(null);
    setEditTitle("");
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={cn(
        "flex h-full w-[290px] flex-col",
        className,
      )}
    >
      {/* HEADER */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Chats</h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-accent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleNewChat}>
                <Plus className="mr-2 h-4 w-4" /> New Chat
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={
                      clearAllMutation.isPending || sessions.length === 0
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear All
                  </DropdownMenuItem>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Chats?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllChats}
                      disabled={clearAllMutation.isPending}
                      className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                      {clearAllMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full shadow-sm active:scale-95 transition-all duration-300 ease-in-out"
          disabled={createSessionMutation.isPending}
        >
          {createSessionMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Chat
        </Button>

        <InputGroup>
          <InputGroupInput placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* CHAT LIST */}
      <ScrollArea className="flex-1 px-3 pb-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-muted" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-6">
            <FolderX className="mb-2 h-8 w-8" />
            <p className="text-sm">{searchQuery ? "No results." : "No chats yet"}</p>
            {!searchQuery && <p className="text-xs mt-1">Start a conversation.</p>}
          </div>
        ) : (
          <div className="space-y-1 p-1">
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.03 },
                  }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <div
                    onClick={() => onSessionSelect(session.id)}
                    className={cn(
                      "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-accent/70 hover:shadow-sm",
                      currentSessionId === session.id && "bg-accent/80 shadow-md border border-border/50",
                    )}
                  >
                    {editingId === session.id ? (
                      <Input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        className="text-sm"
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{truncate(session.title, 20)}</span>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTitle(session);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-destructive/10 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="backdrop-blur-xl border bg-background/80 shadow-2xl rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  Delete Chat?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="pt-1">
                                  This conversation will be <strong>permanently deleted</strong>.
                                  You can’t undo this action.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">
                                  Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90 text-white rounded-lg shadow-lg hover:shadow-red-500/20"
                                  onClick={() => handleDeleteChat(session.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                        </motion.div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </motion.aside>
  );
}
