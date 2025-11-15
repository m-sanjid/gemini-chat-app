"use client";

import { Message } from "@/types/chat";
import { User, Clock, Copy, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { JSX, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

function renderMessage(content: string) {
  const lines = content.split("\n");
  const out: JSX.Element[] = [];
  let buffer: string[] = [];
  let inside = false;
  let lang = "";

  lines.forEach((line, i) => {
    // Code block detection
    if (line.startsWith("```")) {
      if (!inside) {
        inside = true;
        buffer = [];
        lang = line.slice(3).trim() || "code";
      } else {
        inside = false;
        out.push(
          <div
            key={`code-${i}`}
            className="group/code relative my-4 overflow-hidden rounded-xl border border-zinc-800/50 bg-linear-to-br from-zinc-900 to-zinc-950 shadow-xl"
          >
            {/* macOS-style header */}
            <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/90 px-4 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/90 shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/90 shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-green-500/90 shadow-sm" />
                </div>
                {lang && (
                  <span className="ml-2 text-xs font-semibold text-zinc-400">
                    {lang}
                  </span>
                )}
              </div>
              <motion.button
                onClick={() => {
                  navigator.clipboard.writeText(buffer.join("\n"));
                  toast.success("Code copied to clipboard");
                }}
                className="rounded-md p-1.5 opacity-0 transition-all hover:bg-zinc-800/80 group-hover/code:opacity-100"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
              </motion.button>
            </div>
            {/* Code content with syntax highlighting colors */}
            <pre className="overflow-x-auto p-4 text-sm">
              <code className="font-mono leading-relaxed text-zinc-100">
                {buffer.join("\n")}
              </code>
            </pre>
          </div>
        );
        lang = "";
      }
      return;
    }

    if (inside) {
      buffer.push(line);
      return;
    }

    // Enhanced text rendering with markdown support
    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith("### ")) {
      out.push(
        <h3 key={`h3-${i}`} className="mb-2 mt-4 text-base font-bold text-foreground">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      out.push(
        <h2 key={`h2-${i}`} className="mb-3 mt-5 text-lg font-bold text-foreground">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      out.push(
        <h1 key={`h1-${i}`} className="mb-3 mt-5 text-xl font-bold text-foreground">
          {trimmed.slice(2)}
        </h1>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const content = trimmed.slice(2).trim();
      out.push(
        <div key={`li-${i}`} className="mb-2 flex gap-3 leading-relaxed">
          <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
          <span className="flex-1">{parseBoldItalic(content)}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      out.push(
        <div key={`num-${i}`} className="mb-2 flex gap-3 leading-relaxed">
          <span className="font-semibold text-primary/90">{numMatch[1]}.</span>
          <span className="flex-1">{parseBoldItalic(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Block quotes
    if (trimmed.startsWith("> ")) {
      out.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 border-l-4 border-primary/40 bg-primary/5 py-2 pl-4 pr-3 italic text-muted-foreground"
        >
          {parseBoldItalic(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      out.push(
        <hr key={`hr-${i}`} className="my-4 border-t border-border/50" />
      );
      return;
    }

    // Normal text
    if (trimmed.length > 0) {
      out.push(
        <p key={`p-${i}`} className="mb-3 whitespace-pre-wrap leading-relaxed">
          {parseBoldItalic(line)}
        </p>
      );
    } else {
      // Empty line
      out.push(<div key={`space-${i}`} className="h-1" />);
    }
  });

  return out;
}

// Helper function to parse bold and italic text
function parseBoldItalic(text: string): JSX.Element | string {
  // Check if text contains markdown
  if (!text.includes("**") && !text.includes("*") && !text.includes("`")) {
    return text;
  }

  const parts: JSX.Element[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code (highest priority)
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[0.9em] font-mono text-zinc-100"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold text
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-bold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic text
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Regular text
    const nextSpecial = remaining.search(/[*`]/);
    if (nextSpecial === -1) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    } else {
      parts.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{parts}</>;
}

export function MessageBubble({ message }: { message: Message }) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";

  const timestamp = useMemo(() => {
    const d = new Date(message.timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [message.timestamp]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.div
      layout
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group flex w-full gap-4 px-1 transition-all duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <motion.div
          className="shrink-0"
        >
          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-300",
              "bg-linear-to-br from-primary/30 via-primary/20 to-primary/10",
              "border-primary/40",
              hover && "shadow-xl shadow-primary/25"
            )}
          >
            {/* Animated pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{
                scale: hover ? [1, 1.3, 1] : 1,
                opacity: hover ? [0.5, 0, 0.5] : 0,
              }}
              transition={{
                duration: 2,
                repeat: hover ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
            <Sparkles className="relative z-10 h-5 w-5 text-primary" strokeWidth={2} />
          </div>
        </motion.div>
      )}

      {/* Message Column */}
      <div className={cn("flex max-w-[80%] flex-col gap-1.5 md:max-w-[75%]", isUser && "items-end")}>
        {/* Header */}
        <motion.div
          className={cn(
            "flex items-center gap-2 px-1 text-xs",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="font-semibold text-foreground/90">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {timestamp}
          </span>
        </motion.div>

        {/* Message Bubble */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "group/bubble relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300",
            isUser
              ? [
                "bg-linear-to-br from-primary via-primary/95 to-primary/85",
                "text-primary-foreground",
                "border-primary/40",
                "rounded-tr-md",
                "shadow-primary/20",
                hover && "shadow-xl shadow-primary/30",
              ]
              : [
                "bg-linear-to-br from-card via-card/95 to-card/90",
                "text-foreground",
                "border-border/50",
                "rounded-tl-md",
                hover && "shadow-xl border-border/60",
              ],
            "px-5 py-4"
          )}
        >
          {/* Subtle shine effect on hover */}
          <motion.div
            className={cn(
              "pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500",
              isUser ? "from-white/10 to-transparent" : "from-primary/5 to-transparent"
            )}
            animate={{ opacity: hover ? 1 : 0 }}
          />

          {/* Content */}
          <div className="relative z-10 text-[15px] leading-relaxed">
            {renderMessage(message.content)}
          </div>

          {/* Enhanced Copy Button */}
          <AnimatePresence>
            {(hover || copied) && (
              <motion.button
                onClick={handleCopy}
                initial={{ opacity: 0, scale: 0.7, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: -8 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={cn(
                  "absolute top-3 z-40 rounded-lg border p-2 shadow-xl backdrop-blur-xl transition-all duration-200",
                  isUser
                    ? "left-3 border-white/30 bg-white/25 hover:bg-white/35"
                    : "right-3 border-border/50 bg-background/90 hover:bg-background"
                )}
                aria-label="Copy message"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check
                        className={cn("h-4 w-4", isUser ? "text-white" : "text-primary")}
                        strokeWidth={2.5}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Copy
                        className={cn(
                          "h-4 w-4",
                          isUser ? "text-white/90" : "text-muted-foreground"
                        )}
                        strokeWidth={2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <motion.div
          className="shrink-0"
          whileHover={{ scale: 1.15, rotate: -5 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-300",
              "bg-linear-to-br from-primary/35 via-primary/25 to-primary/15",
              "border-primary/40",
              hover && "shadow-xl shadow-primary/25"
            )}
          >
            {/* Rotating ring on hover */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
              animate={{
                rotate: hover ? 360 : 0,
              }}
              transition={{
                duration: 3,
                repeat: hover ? Infinity : 0,
                ease: "linear",
              }}
            />
            <User className="relative z-10 h-5 w-5 text-primary" strokeWidth={2} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}