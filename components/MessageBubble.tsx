"use client";

import { Message } from "@/types/chat";
import { User, Bot, Clock, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.role === "user";

  const timestamp = useMemo(() => {
    const date = new Date(message.timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return (
        "Yesterday at " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }, [message.timestamp]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy message");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "flex w-full gap-4",
        isUser ? "justify-end" : "justify-start",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isUser && (
        <motion.div 
          className="flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div 
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-all duration-200",
              "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/20",
              isHovered && "shadow-md scale-105 border-primary/30"
            )}
          >
            <Bot className="text-primary h-4 w-4" />
          </div>
        </motion.div>
      )}

      <div
        className={cn(
          "group relative flex max-w-[85%] flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "mb-2 flex items-center gap-2",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-sm font-medium text-foreground/90">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{timestamp}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "relative rounded-2xl px-4 py-3 shadow-sm border backdrop-blur-sm transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-none border-primary/20 shadow-primary/10"
              : "bg-gradient-to-br from-muted/80 to-muted/60 rounded-tl-none border-border/50",
            isHovered && (isUser ? "shadow-lg shadow-primary/20" : "shadow-md")
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="group/code relative rounded-lg overflow-hidden my-3"
                    >
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                      
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-2 right-2"
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 hover:bg-background/90 backdrop-blur-sm opacity-0 transition-opacity group-hover/code:opacity-100"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                            toast.success("Code copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <code className={cn("px-1.5 py-0.5 rounded-md text-sm", 
                      isUser ? "bg-primary-foreground/20" : "bg-muted"
                    )} {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-3 last:mb-0 leading-relaxed"
                  >
                    {children}
                  </motion.p>
                ),
                ul: ({ children }) => (
                  <motion.ul 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-3 list-disc pl-5 last:mb-0 space-y-1"
                  >
                    {children}
                  </motion.ul>
                ),
                ol: ({ children }) => (
                  <motion.ol 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-3 list-decimal pl-5 last:mb-0 space-y-1"
                  >
                    {children}
                  </motion.ol>
                ),
                li: ({ children }) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="leading-relaxed"
                  >
                    {children}
                  </motion.li>
                ),
                a: ({ href, children }) => (
                  <motion.a
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "font-medium underline-offset-2 transition-colors hover:underline",
                      isUser ? "text-primary-foreground/90 hover:text-primary-foreground" : "text-primary hover:text-primary/80",
                    )}
                  >
                    {children}
                  </motion.a>
                ),
                blockquote: ({ children }) => (
                  <motion.blockquote 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn(
                      "border-l-4 pl-4 my-3 italic",
                      isUser ? "border-primary-foreground/30" : "border-primary/30"
                    )}
                  >
                    {children}
                  </motion.blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          <AnimatePresence>
            {(isHovered || copied) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "absolute",
                  isUser ? "top-2 left-2" : "top-2 right-2",
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 backdrop-blur-sm transition-colors",
                    isUser 
                      ? "hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground" 
                      : "hover:bg-background/20 text-muted-foreground hover:text-foreground",
                  )}
                  onClick={copyToClipboard}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Copy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {isUser && (
        <motion.div 
          className="flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div 
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-all duration-200",
              "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20",
              isHovered && "shadow-md scale-105 border-primary/30"
            )}
          >
            <User className="text-primary h-4 w-4" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}