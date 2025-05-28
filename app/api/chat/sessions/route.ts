import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { CreateSessionSchema } from "@/lib/validation";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";
import { ValidationError, APIError } from "@/lib/errors";

export async function GET() {
  try {
    const sessions = await db.getAllSessions();
    console.log("Sessions fetched:", sessions);
    return createSuccessResponse(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return createErrorResponse(new APIError("Failed to fetch sessions"));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Incoming body:", body);

    const validationResult = CreateSessionSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.issues);
      throw new ValidationError(
        "Invalid request data",
        validationResult.error.issues,
      );
    }

    const session = await db.createSession(validationResult.data);
    if (!session || !session.id) {
      throw new APIError(
        "Failed to create session: Invalid response from database",
      );
    }

    console.log("Session created:", session);
    return createSuccessResponse(session, 201);
  } catch (error) {
    console.error("Error creating session:", error);
    if (error instanceof ValidationError || error instanceof APIError) {
      return createErrorResponse(error);
    }
    return createErrorResponse(new APIError("Failed to create session"));
  }
}

export async function DELETE() {
  try {
    await db.clearAllSessions();
    console.log("All sessions cleared successfully");
    return createSuccessResponse({
      message: "All sessions cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing sessions:", error);
    return createErrorResponse(new APIError("Failed to clear sessions"));
  }
}
