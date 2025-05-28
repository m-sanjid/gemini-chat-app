import {
  ChatSession,
  CreateSessionRequest,
  UpdateSessionRequest,
  Message,
} from "@/types/chat";
import connectDB from "./mongodb";
import Session, { ISession } from "@/models/Session";

class DatabaseManager {
  async getAllSessions(): Promise<ChatSession[]> {
    await connectDB();
    const sessions = await Session.find().sort({ updatedAt: -1 });
    return sessions.map(this.mapToChatSession);
  }

  async getSession(id: string): Promise<ChatSession | null> {
    await connectDB();
    const session = await Session.findById(id);
    if (!session) {
      console.log(`Session not found in database: ${id}`);
      return null;
    }
    return this.mapToChatSession(session);
  }

  async createSession(data: CreateSessionRequest): Promise<ChatSession> {
    await connectDB();
    const now = new Date();

    const sessionData = {
      title: data.title,
      messages: data.firstMessage
        ? [
            {
              id: data.firstMessage.id,
              content: data.firstMessage.content,
              role: data.firstMessage.role,
              timestamp: now,
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    };

    const session = await Session.create(sessionData);
    console.log(`Created new session: ${session._id}`, session);
    return this.mapToChatSession(session);
  }

  async updateSession(
    id: string,
    updates: UpdateSessionRequest,
  ): Promise<ChatSession | null> {
    await connectDB();
    const session = await Session.findById(id);
    if (!session) {
      console.log(`Session not found for update: ${id}`);
      return null;
    }

    if (updates.title !== undefined) {
      session.title = updates.title;
    }
    if (updates.messages !== undefined) {
      session.messages = updates.messages;
    }
    session.updatedAt = new Date();

    await session.save();
    console.log(`Updated session: ${id}`, session);
    return this.mapToChatSession(session);
  }

  async deleteSession(id: string): Promise<boolean> {
    await connectDB();
    const result = await Session.findByIdAndDelete(id);
    console.log(`Deleted session: ${id}`, result);
    return !!result;
  }

  async clearAllSessions(): Promise<void> {
    await connectDB();
    await Session.deleteMany({});
    console.log("Cleared all sessions");
  }

  private mapToChatSession(session: ISession): ChatSession {
    return {
      id: session._id.toString(),
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userId: session.userId,
    };
  }
}

export const db = new DatabaseManager();
