"use client";

import { Message } from "@/types/chat";
import { User, Clock, Copy, Check, Sparkles, Terminal, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { JSX, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// --- Markdown Parsing Helper ---

function renderMessage(content: string) {
  const lines = content.split("\n");
  const out: JSX.Element[] = [];
  let buffer: string[] = [];
  let inside = false;
  let lang = "";

  lines.forEach((line, i) => {
    // Code block start/end
    if (line.startsWith("```")) {
      if (!inside) {
        inside = true;
        buffer = [];
        lang = line.slice(3).trim() || "text";
      } else {
        inside = false;
        out.push(
          <CodeBlock key={`code-${i}`} language={lang} code={buffer.join("\n")} />
        );
        lang = "";
      }
      return;
    }

    if (inside) {
      buffer.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed && buffer.length === 0) {
      out.push(<div key={`space-${i}`} className="h-2" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      out.push(<h1 key={`h1-${i}`} className="mb-3 mt-6 text-xl font-bold tracking-tight text-foreground/90">{parseBoldItalic(trimmed.slice(2))}</h1>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      out.push(<h2 key={`h2-${i}`} className="mb-3 mt-5 text-lg font-semibold tracking-tight text-foreground/90">{parseBoldItalic(trimmed.slice(3))}</h2>);
      return;
    }
    if (trimmed.startsWith("### ")) {
      out.push(<h3 key={`h3-${i}`} className="mb-2 mt-4 text-base font-semibold text-foreground/90">{parseBoldItalic(trimmed.slice(4))}</h3>);
      return;
    }

    // Lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      out.push(
        <div key={`li-${i}`} className="mb-1 flex items-start gap-3 pl-1">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="leading-relaxed text-foreground/90">{parseBoldItalic(trimmed.slice(2))}</span>
        </div>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      out.push(
        <div key={`num-${i}`} className="mb-1 flex items-start gap-3 pl-1">
          <span className="min-w-[1.2rem] font-mono text-sm font-medium text-primary/70">{numMatch[1]}.</span>
          <span className="leading-relaxed text-foreground/90">{parseBoldItalic(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Blockquotes
    if (trimmed.startsWith("> ")) {
      out.push(
        <blockquote key={`quote-${i}`} className="my-3 border-l-4 border-primary/30 bg-primary/5 py-2 pl-4 pr-2 text-sm italic text-muted-foreground rounded-r-lg">
          {parseBoldItalic(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***") {
      out.push(<hr key={`hr-${i}`} className="my-6 border-border/40" />);
      return;
    }

    // Paragraphs
    if (trimmed.length > 0) {
      out.push(
        <p key={`p-${i}`} className="mb-2 leading-7 text-foreground/90 whitespace-pre-wrap">
          {parseBoldItalic(line)}
        </p>
      );
    }
  });

  return out;
}

function parseBoldItalic(text: string): JSX.Element | string {
  if (!text.includes("**") && !text.includes("*") && !text.includes("`")) return text;

  const parts: JSX.Element[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={key++} className="rounded-md bg-muted/50 px-1.5 py-0.5 font-mono text-[0.9em] text-primary font-medium border border-border/50">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-bold text-foreground">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={key++} className="italic text-foreground/90">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Text
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

// --- Components ---

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/code relative my-4 overflow-hidden rounded-xl border border-border/40 bg-zinc-950 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-3 font-mono text-xs text-zinc-400">{language}</span>
        </div>
        <button
          onClick={copyCode}
          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-relaxed text-zinc-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const timestamp = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }, [message.timestamp]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Message copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group flex w-full gap-4 px-2 py-2 transition-all",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex shrink-0 flex-col items-center gap-2">
          <motion.div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/50"
            whileHover={{ scale: 1.05 }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            <Bot className="relative h-5 w-5 text-primary" />
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
            </span>
          </motion.div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "relative flex max-w-[85%] flex-col gap-1 md:max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Header Info */}
        <div className={cn(
          "flex items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{isUser ? "You" : "Gemini"}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-border" />
          <span>{timestamp}</span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl px-5 py-3.5 shadow-sm transition-all duration-300",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm shadow-primary/10"
              : "bg-card/80 text-foreground border border-border/40 rounded-tl-sm backdrop-blur-sm hover:bg-card/90 hover:shadow-md hover:border-primary/20"
          )}
        >
          {/* Glass shine for user bubble */}
          {isUser && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          )}

          <div className="relative z-10 text-[15px] leading-relaxed">
            {renderMessage(message.content)}
          </div>

          {/* Copy Button (Absolute) */}
          <AnimatePresence>
            {hover && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleCopy}
                className={cn(
                  "absolute top-2 p-1.5 rounded-lg backdrop-blur-md transition-colors",
                  isUser
                    ? "left-2 text-primary-foreground/70 hover:bg-white/20 hover:text-white"
                    : "right-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex shrink-0 flex-col items-center gap-2">
          <motion.div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shadow-sm ring-1 ring-border/50"
            whileHover={{ scale: 1.05 }}
          >
            <User className="h-5 w-5 text-primary" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

