// src/middleware/errorHandler.ts
import { ZodError } from "zod";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} from "../types/errors";

// Express error handling middleware (4 args)
export const errorHandler = (
  err: any,
  _req: any,
  res: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: any
) => {
  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "BAD_REQUEST",
        details: err.issues,
      },
    });
  }

  // Custom error classes with statusCode & code
  if (
    err instanceof NotFoundError ||
    err instanceof ForbiddenError ||
    err instanceof BadRequestError ||
    err instanceof UnauthorizedError
  ) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Fallback internal server error
  console.error(err);
  return res.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL",
    },
  });
};
