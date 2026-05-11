import { ZodError } from "zod";
import { AppError } from "./AppError";

/**
 * Handle Zod validation errors
 * @param error - ZodError instance
 * @returns AppError with validation details
 */
export const handleZodError = (error: ZodError): AppError => {
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    fieldErrors[path] = issue.message;
  });

  const errorMessage = `Validation failed: ${Object.entries(fieldErrors)
    .map(([field, msg]) => `${field} - ${msg}`)
    .join("; ")}`;

  return new AppError(errorMessage, 400);
};
