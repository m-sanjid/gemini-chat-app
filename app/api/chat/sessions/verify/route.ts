import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";
import { ValidationError, APIError } from "@/lib/errors";

// Declare global type for _sessions
declare global {
  // eslint-disable-next-line no-var
  var _sessions: Map<string, unknown> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      throw new ValidationError("Session ID is required");
    }

    console.log(`Verifying session: ${sessionId}`);

    // Add a small delay to ensure database consistency
    await new Promise((resolve) => setTimeout(resolve, 100));

    const session = await db.getSession(sessionId);
    console.log(
      `Session verification result:`,
      session ? "Found" : "Not found",
    );
    console.log(
      `Current sessions in memory:`,
      Array.from(global._sessions?.keys() || []),
    );

    return createSuccessResponse({
      exists: !!session,
      session: session || null,
      totalSessions: global._sessions?.size || 0,
    });
  } catch (error) {
    console.error("Session verification error:", error);
    if (error instanceof ValidationError || error instanceof APIError) {
      return createErrorResponse(error);
    }
    return createErrorResponse(new APIError("Failed to verify session"));
  }
}