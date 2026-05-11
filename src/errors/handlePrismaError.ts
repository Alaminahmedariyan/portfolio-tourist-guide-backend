import { AppError } from './AppError';

/**
 * Handle Prisma database errors
 * Maps Prisma error codes to user-friendly messages
 * @param error - Prisma error instance
 * @returns AppError with appropriate status code and message
 */
export const handlePrismaError = (error: any): AppError => {
  const errorMap: Record<string, { message: string; statusCode: number }> = {
    P2000: {
      message: 'The value provided is too long for the field',
      statusCode: 400,
    },
    P2002: {
      message: 'A unique constraint was violated',
      statusCode: 409,
    },
    P2003: {
      message: 'Foreign key constraint failed',
      statusCode: 400,
    },
    P2014: {
      message: 'Required relation violation',
      statusCode: 400,
    },
    P2025: {
      message: 'Record not found',
      statusCode: 404,
    },
    P2028: {
      message: 'Transaction API error',
      statusCode: 500,
    },
    P2030: {
      message: 'Cannot find a fulltext index to use for search',
      statusCode: 400,
    },
  };

  const errorCode = error.code || 'UNKNOWN_PRISMA_ERROR';
  const mappedError = errorMap[errorCode];

  if (mappedError) {
    return new AppError(mappedError.message, mappedError.statusCode);
  }

  // Default handling for unknown Prisma errors
  const message =
    process.env.NODE_ENV === 'production'
      ? 'A database error occurred'
      : error.message || 'Unknown database error';

  return new AppError(message, 500);
};
