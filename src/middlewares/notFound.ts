import { Request, Response } from 'express';

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    error: `The requested route ${req.originalUrl} does not exist`
  });
};
