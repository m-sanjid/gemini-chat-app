import React from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  Trash2,
  Menu,
  Settings,
  HelpCircle,
  MessageSquare,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import MotionDiv from "./MotionDiv";

const Navbar = ({
  clearChat,
  messages,
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  isLoading,
}: {
  clearChat: () => void;
  messages: any[];
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
      <div className="mx-auto max-w-6xl flex items-center justify-between">
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
            <h1 className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-sm md:text-2xl font-bold text-transparent">
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
        <div className="items-center gap-3 hidden md:flex">
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

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary/10"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Documentation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={clearChat}
                disabled={messages.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Chats
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear current chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ThemeToggle />
        </div>
      </div>
    </MotionDiv>
  );
};

export default Navbar;
