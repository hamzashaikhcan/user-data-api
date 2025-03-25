import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async controller functions to eliminate try-catch boilerplate
 * @param fn Controller function that returns a Promise
 * @returns Express middleware function that handles errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;