import mongoose, { Schema, Document } from "mongoose";
import { ChatSession, Message } from "@/types/chat";

export interface ISession extends Document, Omit<ChatSession, "id"> {
  _id: string;
}

const MessageSchema = new Schema<Message>({
  id: { type: String, required: true },
  content: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  timestamp: { type: Date, required: true },
});

const SessionSchema = new Schema<ISession>({
  title: { type: String, required: true },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: String, required: false },
});

// Update the updatedAt timestamp before saving
SessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
SessionSchema.index({ createdAt: -1 });
SessionSchema.index({ updatedAt: -1 });
SessionSchema.index({ userId: 1 });

export default mongoose.models.Session ||
  mongoose.model<ISession>("Session", SessionSchema);
