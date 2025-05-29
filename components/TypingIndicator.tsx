import { motion } from "motion/react";

// Typing indicator component
export function TypingIndicator() {
  return (
    <div className="flex w-full gap-4">
      <div className="flex-shrink-0">
        <div className="from-primary/20 to-primary/10 border-primary/20 flex h-8 w-8 items-center justify-center rounded-full border bg-gradient-to-br shadow-sm">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="bg-primary h-2 w-2 rounded-full"
          />
        </div>
      </div>

      <div className="flex max-w-[85%] flex-col items-start">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-foreground/90 text-sm font-medium">
            AI Assistant
          </span>
        </div>

        <div className="from-muted/80 to-muted/60 border-border/50 relative rounded-2xl rounded-tl-none border bg-gradient-to-br px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <motion.div
              className="bg-primary/60 h-2 w-2 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }}
            />
            <motion.div
              className="bg-primary/60 h-2 w-2 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
            <motion.div
              className="bg-primary/60 h-2 w-2 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
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
