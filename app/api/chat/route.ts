import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ChatRequestSchema } from "@/lib/validation";
import { aiService } from "@/lib/AIService";
import { createErrorResponse } from "@/lib/response";
import { ValidationError, APIError, NotFoundError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Incoming chat request:", body);

    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.issues);
      throw new ValidationError(
        "Invalid request data",
        validationResult.error.issues,
      );
    }

    const { sessionId, message, history } = validationResult.data;

    // Verify session exists with retry
    let session = null;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 100; // ms

    while (!session && retryCount < maxRetries) {
      session = await db.getSession(sessionId);
      if (!session) {
        console.log(`Session not found, retry ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    if (!session) {
      console.error(
        `Session not found after ${maxRetries} retries: ${sessionId}`,
      );
      throw new NotFoundError("Session");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseGenerator = await aiService.generateResponse(
            message,
            history,
          );

          for await (const chunk of responseGenerator) {
            const data = JSON.stringify({ content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({
            error: "Failed to generate response",
            code: "AI_ERROR",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof APIError
    ) {
      return createErrorResponse(error);
    }
    return createErrorResponse(new APIError("Failed to process chat request"));
  }
}