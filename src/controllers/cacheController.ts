import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import cacheService from '../services/cacheService';
import queueService from '../services/queueService';

export const getCacheStatus = asyncHandler(async (req: Request, res: Response) => {
  const cacheStats = cacheService.getStats();
  
  res.status(200).json({
    status: 'success',
    data: {
      cache: cacheStats,
    }
  });
});

export const clearCache = asyncHandler(async (req: Request, res: Response) => {
  cacheService.clear();
  
  res.status(200).json({
    status: 'success',
    message: 'Cache cleared successfully'
  });
});

export const getQueueStatus = asyncHandler(async (req: Request, res: Response) => {
  const queueStats = await queueService.getQueueStatus();
  
  res.status(200).json({
    status: 'success',
    data: {
      queue: queueStats
    }
  });
});

export const getSystemStatus = asyncHandler(async (req: Request, res: Response) => {
  const [cacheStats, queueStats] = await Promise.all([
    cacheService.getStats(),
    queueService.getQueueStatus()
  ]);
  
  res.status(200).json({
    status: 'success',
    timestamp: new Date(),
    data: {
      cache: cacheStats,
      queue: queueStats
    }
  });
});