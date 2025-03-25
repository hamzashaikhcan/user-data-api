import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import userService from '../services/userService';

export const getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return next(new AppError('Invalid user ID. Must be a number.', 400));
  }
  
  const startTime = Date.now();
  const user = await userService.getUserById(userId);
  const responseTime = Date.now() - startTime;
  
  if (!user) {
    return next(new AppError(`User with ID ${userId} not found`, 404));
  }
  
  // Added response time header for monitoring
  res.setHeader('X-Response-Time', `${responseTime}ms`);
  
  res.status(200).json({
    status: 'success',
    responseTime,
    data: {
      user
    }
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return next(new AppError('Name and email are required', 400));
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Invalid email format', 400));
  }
  
  const startTime = Date.now();
  const newUser = await userService.createUser({ name, email });
  const responseTime = Date.now() - startTime;
  
  // Added response time header for monitoring
  res.setHeader('X-Response-Time', `${responseTime}ms`);
  
  res.status(201).json({
    status: 'success',
    responseTime,
    data: {
      user: newUser
    }
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const users = await userService.getAllUsers();
  const responseTime = Date.now() - startTime;
  
  // Added response time header for monitoring
  res.setHeader('X-Response-Time', `${responseTime}ms`);
  
  res.status(200).json({
    status: 'success',
    responseTime,
    results: users.length,
    data: {
      users
    }
  });
});