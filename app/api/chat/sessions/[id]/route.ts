import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { UpdateSessionSchema } from "@/lib/validation";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";
import { ValidationError, APIError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) throw new ValidationError("Session ID is required");

    const session = await db.getSession(id);
    if (!session) throw new NotFoundError("Session");

    return createSuccessResponse(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    if (error instanceof NotFoundError || error instanceof APIError) {
      return createErrorResponse(error);
    }
    return createErrorResponse(new APIError("Failed to fetch session"));
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) throw new ValidationError("Session ID is required");

    const body = await request.json();
    const validationResult = UpdateSessionSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        "Invalid request data",
        validationResult.error.issues
      );
    }

    const updatedSession = await db.updateSession(id, validationResult.data);
    if (!updatedSession) throw new NotFoundError("Session");

    return createSuccessResponse(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof APIError
    ) {
      return createErrorResponse(error);
    }
    return createErrorResponse(new APIError("Failed to update session"));
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) throw new ValidationError("Session ID is required");

    const deleted = await db.deleteSession(id);
    if (!deleted) throw new NotFoundError("Session");

    return createSuccessResponse({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    if (error instanceof NotFoundError || error instanceof APIError) {
      return createErrorResponse(error);
    }
    return createErrorResponse(new APIError("Failed to delete session"));
  }
}