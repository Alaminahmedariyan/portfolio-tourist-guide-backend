import { ZodError } from "zod";
import { ErrorResponse } from "../types/errorResponse";

/**
 * Handle Zod validation errors
 * Extracts field-level validation errors
 * @param error - ZodError instance
 * @returns ErrorResponse with validation details
 */
export const handleZodErrorResponse = (error: ZodError): ErrorResponse => {
  const fieldErrors: Record<string, any> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    fieldErrors[path] = issue.message;
  });

  return {
    success: false,
    error: {
      message: "Validation error",
      code: "VALIDATION_ERROR",
      details: fieldErrors,
    },
    slack: { enabled: false },
  };
};
