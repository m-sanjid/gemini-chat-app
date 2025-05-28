import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  timestamp: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
});

export const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  firstMessage: z
    .object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1),
    })
    .optional(),
});

export const UpdateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  messages: z.array(MessageSchema).optional(),
});

export const ChatRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(10000),
  history: z.array(MessageSchema).default([]),
});
