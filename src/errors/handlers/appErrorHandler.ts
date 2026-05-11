import { ErrorResponse } from "../types/errorResponse";
import { AppError } from "../AppError";

/**
 * Handle custom AppError
 * @param error - AppError instance
 * @returns ErrorResponse with app error details
 */
export const handleAppErrorResponse = (error: AppError): ErrorResponse => {
  return {
    success: false,
    error: {
      message: error.message,
      code: "APP_ERROR",
    },
    slack: { enabled: error.statusCode >= 500 },
  };
};

/**
 * Handle generic Error instances
 * @param error - Error instance
 * @returns ErrorResponse with generic error details
 */
export const handleGenericErrorResponse = (error: Error): ErrorResponse => {
  return {
    success: false,
    error: {
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : error.message,
      code: "INTERNAL_SERVER_ERROR",
    },
    slack: { enabled: true },
  };
};

/**
 * Handle unknown error types
 * @returns ErrorResponse for unknown errors
 */
export const handleUnknownErrorResponse = (): ErrorResponse => {
  return {
    success: false,
    error: {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    slack: { enabled: true },
  };
};
