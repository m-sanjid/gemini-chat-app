"use client";

import { InputGroup, InputGroupAddon, InputGroupInput, } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInputBar({
  input,
  setInput,
  handleSendMessage,
  handleKeyDown,
  inputRef,
  isLoading,
}: {
  input: string;
  setInput: (v: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: any;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25 }}
      className="relative border-t border-border/40 bg-gradient-to-t from-background/95 via-background/90 to-transparent backdrop-blur-xl"
    >
      {/* Top subtle separator */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative"
        >
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="group"
          >
            {/* INPUT GROUP */}
            <InputGroup
              className={cn(
                "rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 bg-card/40",
                "hover:shadow-xl hover:border-border/50",
                "focus-within:border-primary/50 focus-within:shadow-primary/10",
                "overflow-hidden",
                "min-h-[64px]",
                "placeholder:text-muted-foreground/50",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "disabled:cursor-not-allowed"
              )}
            >
              {/* Input field */}
              <InputGroupInput
                ref={inputRef}
                placeholder="Ask me anything..."
                value={input}
                disabled={isLoading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* SEND BUTTON SLOT */}
              <InputGroupAddon align="inline-end" className="pr-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || input.trim() === ""}
                    className={cn(
                      "h-11 w-11 rounded-xl shadow-lg transition-all duration-300",
                      "bg-linear-to-br from-primary to-primary/90",
                      "hover:from-primary/90 hover:to-primary hover:shadow-primary/20",
                      "disabled:opacity-40 disabled:shadow-none",
                      input.trim() && !isLoading && "animate-pulse"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="send"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.25 }}
                        >
                          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </InputGroupAddon>
            </InputGroup>
          </motion.div>

          {/* INPUT HINTS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground/60"
          >
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-xs">
                Enter
              </kbd>
              <span>to send</span>
            </span>

            <span className="opacity-30">•</span>

            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-xs">
                Shift
              </kbd>
              +
              <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-xs">
                Enter
              </kbd>
              <span>for newline</span>
            </span>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
