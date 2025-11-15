import { motion } from "motion/react";

// Typing indicator component
export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 px-4">
      <div className="flex-shrink-0">
        <div className="from-primary/30 to-primary/15 border-primary/30 flex h-10 w-10 items-center justify-center rounded-full border bg-gradient-to-br shadow-md">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="bg-primary h-2.5 w-2.5 rounded-full"
          />
        </div>
      </div>

      <div className="flex max-w-[80%] md:max-w-[75%] flex-col items-start">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <span className="text-foreground/90 text-xs font-semibold">
            AI Assistant
          </span>
        </div>

        <div className="from-card/80 to-card/60 border-border/50 relative rounded-2xl rounded-tl-sm border bg-gradient-to-br px-5 py-3.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <motion.div
              className="bg-primary/70 h-2 w-2 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }}
            />
            <motion.div
              className="bg-primary/70 h-2 w-2 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
            <motion.div
              className="bg-primary/70 h-2 w-2 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
