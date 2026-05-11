import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../errors/AppError";
import { ErrorResponse } from "../errors/types/errorResponse";
import { logError } from "../errors/utils/logger";
import { notifySlack } from "../errors/utils/slack";
import {
  handleZodErrorResponse,
  handlePrismaValidationErrorResponse,
  handlePrismaKnownErrorResponse,
  handlePrismaInitializationErrorResponse,
  handleAppErrorResponse,
  handleGenericErrorResponse,
  handleUnknownErrorResponse,
} from "../errors/handlers";

/**
 * Global error handler middleware
 * Handles all types of errors: Zod, Prisma, AppError, and generic errors
 * Logs errors and optionally notifies Slack for critical issues
 * @param error - Error instance
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const globalErrorHandler = async (
  error:
    | Error
    | AppError
    | ZodError
    | Prisma.PrismaClientValidationError
    | Prisma.PrismaClientKnownRequestError
    | Prisma.PrismaClientInitializationError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const timestamp = new Date().toISOString();
  let statusCode = 500;
  let errorResponse: ErrorResponse;

  // Log error for debugging
  logError(error, req);

  try {
    // Handle different error types and get appropriate response
    if (error instanceof ZodError) {
      statusCode = 400;
      errorResponse = handleZodErrorResponse(error);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      statusCode = 400;
      errorResponse = handlePrismaValidationErrorResponse(error);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = 400;
      errorResponse = handlePrismaKnownErrorResponse(error);
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      statusCode = 503;
      errorResponse = handlePrismaInitializationErrorResponse(error);
    } else if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorResponse = handleAppErrorResponse(error);
    } else if (error instanceof Error) {
      statusCode = 500;
      errorResponse = handleGenericErrorResponse(error);
    } else {
      statusCode = 500;
      errorResponse = handleUnknownErrorResponse();
    }

    // Add request metadata to error response
    errorResponse.error.timestamp = timestamp;
    errorResponse.error.path = req.path;
    errorResponse.error.method = req.method;

    // Notify Slack if needed (for critical errors)
    if (errorResponse.slack?.enabled) {
      const slackNotified = await notifySlack(error, statusCode, req);
      errorResponse.slack.notified = slackNotified;
      errorResponse.slack.timestamp = timestamp;
    }

    // Send error response to client
    res.status(statusCode).json(errorResponse);
  } catch (handlerError) {
    // Fallback error response if error handler itself fails
    console.error("Error handler failed:", handlerError);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "ERROR_HANDLER_FAILURE",
        timestamp,
      },
      slack: { enabled: false },
    });
  }
};
