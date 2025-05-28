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
import { cn } from "@/lib/utils";
import {
  useChatSessions,
  useCreateSession,
  useDeleteSession,
  useClearAllChats,
  useUpdateSession,
} from "@/hooks/useChatHistory";
import { ChatSession } from "@/types/chat";

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
      (session) =>
        session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages?.some((m) =>
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "bg-background flex h-full w-[280px] flex-col border-r",
        className,
      )}
    >
      {/* Top header */}
      <div className="bg-background sticky top-0 z-10 space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Chats</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleNewChat}>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                    disabled={
                      clearAllMutation.isPending || sessions.length === 0
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Chats</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all chat history permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllChats}
                      disabled={clearAllMutation.isPending}
                      className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                      {clearAllMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
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
          className="w-full"
          disabled={createSessionMutation.isPending}
        >
          {createSessionMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Chat
        </Button>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1 px-2 pb-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3 p-4">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="bg-muted h-10 rounded-md" />
              ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center p-6 text-center">
            <FolderX className="mb-2 h-8 w-8" />
            <p className="text-sm">
              {searchQuery ? "No chats found." : "No chats yet"}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-xs">
                Start a conversation to see it here.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    onClick={() => onSessionSelect(session.id)}
                    className={cn(
                      "group hover:bg-muted flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-all",
                      currentSessionId === session.id && "bg-muted",
                    )}
                  >
                    {editingId === session.id ? (
                      <Input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="text-sm"
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="text-muted-foreground h-4 w-4" />
                          <span className="truncate">{session.title}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(session.id);
                            }}
                          >
                            <Trash2 className="text-destructive h-3 w-3" />
                          </Button>
                        </div>
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
