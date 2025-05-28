export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export type SessionWrapper = {
  success: boolean;
  data: ChatSession;
  timestamp: string;
};

export interface CreateSessionRequest {
  title: string;
  firstMessage?: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
  };
}

export interface UpdateSessionRequest {
  messages?: Message[];
  title?: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  history: Message[];
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}
