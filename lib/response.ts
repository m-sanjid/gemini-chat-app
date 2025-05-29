import { NextResponse } from "next/server";
import { APIResponse } from "@/types/chat";
import { APIError, ValidationError } from "./errors";

export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function createErrorResponse(
  error: APIError | Error,
  status?: number,
): NextResponse<APIResponse> {
  const statusCode =
    error instanceof APIError ? error.statusCode : status || 500;

  return NextResponse.json(
    {
      success: false,
      error: {
        message: error.message,
        code: error instanceof APIError ? error.code : "INTERNAL_ERROR",
        details: error instanceof ValidationError ? error.issues : undefined,
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}
