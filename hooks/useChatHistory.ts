import { ChatSession } from "@/types/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type MessageRole = "user" | "assistant" | "system";
export interface UpdateSessionRequest {
  id: string;
  messages?: ChatMessage[];
  title?: string;
}
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export interface CreateSessionInput {
  title: string;
  firstMessage?: ChatMessage;
}

export const chatKeys = {
  all: ["chat"] as const,
  sessions: () => [...chatKeys.all, "sessions"] as const,
  session: (id: string) => [...chatKeys.sessions(), id] as const,
  messages: (sessionId: string) =>
    [...chatKeys.all, "messages", sessionId] as const,
};

const chatApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
  },

  getSession: async (id: string): Promise<ChatSession | null> => {
    try {
      const response = await fetch(`/api/chat/sessions/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch session: ${response.status}`);
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error("Error fetching session:", error);
      return null;
    }
  },

  createSession: async (data: CreateSessionInput): Promise<ChatSession> => {
    const response = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create session: ${response.status} - ${errorText}`,
      );
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error("Invalid response format from server");
    }

    return result.data;
  },

  updateSession: async (data: UpdateSessionRequest): Promise<ChatSession> => {
    const response = await fetch(`/api/chat/sessions/${data.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update session: ${response.status} - ${errorText}`,
      );
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error("Invalid response format from server");
    }

    return result.data;
  },

  deleteSession: async (id: string): Promise<void> => {
    const response = await fetch(`/api/chat/sessions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete session: ${response.status} - ${errorText}`,
      );
    }
  },

  clearAllSessions: async (): Promise<void> => {
    const response = await fetch("/api/chat/sessions", {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to clear all sessions: ${response.status} - ${errorText}`,
      );
    }
  },

  verifySession: async (sessionId: string): Promise<boolean> => {
    const response = await fetch("/api/chat/sessions/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success && data.data?.exists;
  },
};

export function useChatSessions() {
  return useQuery({
    queryKey: chatKeys.sessions(),
    queryFn: chatApi.getSessions,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (API not implemented yet)
      if (error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useChatSession(id?: string) {
  return useQuery({
    queryKey: chatKeys.session(id || ""),
    queryFn: () => chatApi.getSession(id!),
    enabled: !!id && id !== "new",
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry if it's a 404
      if (error?.message?.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      try {
        const response = await chatApi.createSession(data);
        if (!response || !response.id) {
          console.error("Invalid session response:", response);
          throw new Error("Invalid session response from server");
        }
        return response;
      } catch (error) {
        console.error("Session creation error:", error);
        throw error;
      }
    },
    onSuccess: async (newSession) => {
      // Update the sessions list
      queryClient.setQueryData(
        chatKeys.sessions(),
        (old: ChatSession[] = []) => {
          if (!Array.isArray(old)) {
            console.warn("Expected sessions to be an array, but got:", old);
            return [newSession];
          }
          return [newSession, ...old];
        },
      );

      // Set the current session data
      queryClient.setQueryData(chatKeys.session(newSession.id), newSession);

      // Wait for a short time to ensure the session is available
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the session exists
      const exists = await chatApi.verifySession(newSession.id);
      if (!exists) {
        throw new Error("Failed to verify session creation");
      }

      toast.success("Chat session created");
    },
    onError: (error) => {
      console.error("Failed to create session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create session",
      );
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.updateSession,
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(
        chatKeys.session(updatedSession.id),
        updatedSession,
      );
      queryClient.setQueryData(
        chatKeys.sessions(),
        (old: ChatSession[] = []) =>
          Array.isArray(old)
            ? old.map((session) =>
                session.id === updatedSession.id ? updatedSession : session,
              )
            : [updatedSession],
      );
      toast.success("Chat session updated");
    },
    onError: (error) => {
      console.error("Failed to update session:", error);
      toast.error("Failed to update chat");
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(chatKeys.sessions(), (old: ChatSession[] = []) =>
        old.filter((session) => session.id !== deletedId),
      );
      queryClient.removeQueries({ queryKey: chatKeys.session(deletedId) });
      toast.success("Chat deleted");
    },
    onError: (error) => {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete chat");
    },
  });
}

export function useClearAllChats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.clearAllSessions,
    onSuccess: () => {
      queryClient.setQueryData(chatKeys.sessions(), []);
      queryClient.removeQueries({ queryKey: chatKeys.all });
      toast.success("All chats cleared");
    },
    onError: (error) => {
      console.error("Failed to clear all chats:", error);
      toast.error("Failed to clear chats");
    },
  });
}

export function useVerifySession() {
  return useMutation({
    mutationFn: chatApi.verifySession,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
