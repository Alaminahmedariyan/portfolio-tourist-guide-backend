import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Industry Standard catchAsync Utility
 */
export const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};