import React from "react";
import { MotionButton } from "./ui/MotionButton";
import { ThemeToggle } from "./ThemeToggle";
import {
  Trash2,
  Menu,
  MessageSquare,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import MotionDiv from "./MotionDiv";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Message } from "@/types/chat";
import { AnimatePresence } from "motion/react";

const Navbar = ({
  clearChat,
  messages,
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  isLoading,
}: {
  clearChat: () => void;
  messages: Message[];
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  isLoading?: boolean;
}) => {
  return (
    <MotionDiv
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 md:p-3"
    >
      <nav
        className="bg-background/95 border-b border-border md:rounded-lg backdrop-blur-xl max-w-7xl mx-auto px-4 py-3 shadow-sm"
      >
        {/* This div correctly wraps BOTH left and right sides */}
        <div className="flex items-center justify-between">
          {/* === LEFT SIDE === */}
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="hover:bg-primary/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {/* Animated Icon Toggle */}
                    <AnimatePresence initial={false} mode="wait">
                      <MotionDiv
                        key={isSidebarOpen ? "x" : "menu"}
                        initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSidebarOpen ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Menu className="h-4 w-4" />
                        )}
                      </MotionDiv>
                    </AnimatePresence>
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <MessageSquare className="text-primary size-6 p-1 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-black/10 dark:bg-white/10 backdrop-blur-lg" />
              <h1 className="font-light">
                Gemini Chat
              </h1>
            </MotionDiv>
          </div>

          {/* === RIGHT SIDE (MOBILE) === */}
          <div className="flex items-center gap-1 md:hidden">
            <TooltipProvider>
              {/* Mobile: New Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    variant="ghost"
                    size="icon"
                    onClick={onNewChat}
                    disabled={isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>

              {/* Mobile: Clear Chat */}
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <MotionButton
                        variant="ghost"
                        size="icon"
                        disabled={messages.length === 0 || isLoading}
                        className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </MotionButton>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear Chat</p>
                  </TooltipContent>
                </Tooltip>
                {/* Re-using the same Alert Dialog Content */}
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Chat</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the current chat history permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearChat}
                      disabled={isLoading}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <ThemeToggle />
            </TooltipProvider>
          </div>

          {/* === RIGHT SIDE (DESKTOP) === */}
          <div className="hidden items-center gap-3 md:flex">
            <TooltipProvider>
              {/* Desktop: New Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <MotionButton
                    variant="outline"
                    size="sm"
                    onClick={onNewChat}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    New Chat
                  </MotionButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start a new conversation</p>
                </TooltipContent>
              </Tooltip>

              {/* Desktop: Clear Chat */}
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <MotionButton
                        variant="outline"
                        size="sm"
                        disabled={messages.length === 0 || isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                        {messages.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {messages.length}
                          </Badge>
                        )}
                      </MotionButton>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear current chat history</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Chat</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the current chat history permanently.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearChat}
                      disabled={isLoading}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <ThemeToggle />
            </TooltipProvider>
          </div>
        </div>
      </nav>
    </MotionDiv>
  );
};

export default Navbar;