import { Router } from 'express';
import { 
  getCacheStatus, 
  clearCache, 
  getQueueStatus, 
  getSystemStatus 
} from '../controllers/cacheController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiter to all cache routes
router.use(apiRateLimiter);

// GET cache status
router.get('/status', getCacheStatus);

// DELETE clear cache
router.delete('/', clearCache);

// GET queue status
router.get('/queue', getQueueStatus);

// GET system status (including cache and queue)
router.get('/system', getSystemStatus);

export default router;