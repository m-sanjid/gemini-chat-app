import { Message } from "@/types/chat";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export class AIService {
  async generateResponse(
    message: string,
    history: Message[],
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare Gemini chat history in expected format
    const chatHistory =
      history?.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })) || [];

    const chat = model.startChat({ history: chatHistory });

    // Start streaming the response from Gemini
    const result = await chat.sendMessageStream(message);

    // Create an async generator to yield chunks of text as they arrive
    async function* streamGenerator() {
      try {
        for await (const chunk of result.stream) {
          // chunk.text() returns the text content of this streaming chunk
          yield chunk.text();
        }
      } catch (error) {
        console.error("Streaming error:", error);
      }
    }

    return streamGenerator();
  }
}

export const aiService = new AIService();
