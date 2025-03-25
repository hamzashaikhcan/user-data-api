import { Request, Response, NextFunction } from 'express';
import monitoringService from '../services/monitoringService';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let stack: string | undefined;

  // If it's our custom AppError, use its status code and message
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    stack = err instanceof Error ? err.stack : undefined;
  }

  // Log error using monitoring service
  monitoringService.logError(err, {
    path: req.path,
    method: req.method,
    statusCode,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Send error response
  res.status(statusCode).json({
    status: statusCode,
    message,
    ...(stack && process.env.NODE_ENV === 'development' && { stack }),
  });
};

// This utility wraps async route handlers to catch errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Not found - ${req.originalUrl}`, 404));
};