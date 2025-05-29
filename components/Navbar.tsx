import React from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Trash2, Menu, MessageSquare, Plus, Loader2 } from "lucide-react";
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
      className="bg-background/95 sticky top-0 z-50 border-b p-3 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="hover:bg-primary/10"
                >
                  <Menu className="h-4 w-4" />
                </Button>
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
            <MessageSquare className="text-primary h-5 w-5" />
            <h1 className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-sm font-bold text-transparent md:text-2xl">
              Gemini Chat
            </h1>
          </MotionDiv>
        </div>
        {/* Mobile Navbar */}
        <div className="items-center gap-1 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChat}
            disabled={isLoading}
          >
            New Chat
          </Button>

          <ThemeToggle />
        </div>

        {/* Desktop Navbar */}
        <div className="hidden items-center gap-3 md:flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewChat}
                  className="transition-all duration-200 hover:scale-105"
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a new conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={messages.length === 0 || isLoading}
                className="transition-all duration-200 hover:scale-105"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
                {messages.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {messages.length}
                  </Badge>
                )}
              </Button>
            </AlertDialogTrigger>
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
                  className="bg-destructive hover:bg-destructive/90 text-white"
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
        </div>
      </div>
    </MotionDiv>
  );
};

export default Navbar;
