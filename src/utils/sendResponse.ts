import { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success?: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data?: T;
}

export const sendResponse = <T>(res: Response, data: IResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success ?? true,
    message: data.message,
    meta: data.meta || null,
    data: data.data || null,
  });
};