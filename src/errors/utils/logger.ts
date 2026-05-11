import { Request } from "express";

/**
 * Log error details for debugging and monitoring
 * Can be replaced with Winston, Pino, or other logging libraries
 * @param error - Error instance
 * @param req - Express request object
 */
export const logError = (error: Error, req: Request): void => {
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    message: error.message,
    stack: error.stack,
  });
};
