export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public issues?: any[],
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class RateLimitError extends APIError {
  constructor() {
    super("Too many requests", 429, "RATE_LIMITED");
  }
}
