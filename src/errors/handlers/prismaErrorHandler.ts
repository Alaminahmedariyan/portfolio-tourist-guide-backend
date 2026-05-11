import { Prisma } from "../../generated/prisma/client";
import { ErrorResponse } from "../types/errorResponse";

/**
 * Handle Prisma validation errors
 * Errors related to invalid query structure
 * @param error - PrismaClientValidationError
 * @returns ErrorResponse with validation error details
 */
export const handlePrismaValidationErrorResponse = (error: Prisma.PrismaClientValidationError): ErrorResponse => {
  return {
    success: false,
    error: {
      message: "Invalid request data",
      code: "PRISMA_VALIDATION_ERROR",
      details: {
        prismaMessage: error.message,
      },
    },
    slack: { enabled: false },
  };
};

/**
 * Handle Prisma known request errors
 * Maps Prisma error codes (P2002, P2025, etc.) to user-friendly messages
 * @param error - PrismaClientKnownRequestError
 * @returns ErrorResponse with mapped error details
 */
export const handlePrismaKnownErrorResponse = (error: Prisma.PrismaClientKnownRequestError): ErrorResponse => {
  const errorCodeMap: Record<string, string> = {
    P2000: "The value provided is too long for the field",
    P2002: "A unique constraint was violated",
    P2003: "Foreign key constraint failed",
    P2014: "Required relation violation",
    P2025: "Record not found",
  };

  const message = errorCodeMap[error.code] || "Database operation failed";

  return {
    success: false,
    error: {
      message,
      code: error.code,
      details: {
        meta: error.meta,
      },
    },
    slack: { enabled: false },
  };
};

/**
 * Handle Prisma initialization errors
 * Errors related to database connection issues
 * @param error - PrismaClientInitializationError
 * @returns ErrorResponse with initialization error details
 */
export const handlePrismaInitializationErrorResponse = (error: Prisma.PrismaClientInitializationError): ErrorResponse => {
  return {
    success: false,
    error: {
      message: process.env.NODE_ENV === "production" ? "Database connection failed" : error.message,
      code: "PRISMA_INITIALIZATION_ERROR",
      details: process.env.NODE_ENV === "production" ? {} : { originalMessage: error.message },
    },
    slack: { enabled: true },
  };
};
