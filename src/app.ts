import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import userRoutes from './routes/userRoutes';
import cacheRoutes from './routes/cacheRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';
import config from './config/config';
import { advancedRateLimiter } from './middleware/rateLimiter';
import monitoringService from './services/monitoringService';

// Create Express app
const app = express();

// Apply global middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Add request logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined')); // HTTP logging
}

// Add monitoring middleware
app.use(monitoringService.prometheusMiddleware); // Prometheus metrics collection
app.use(monitoringService.responseTimeMiddleware); // Response time tracking
app.use(monitoringService.requestLoggerMiddleware); // Request logging

// Apply global rate limiter with higher limits for API health check
const globalRateLimiter = advancedRateLimiter(
  config.RATE_LIMIT_MAX * 2, 
  config.RATE_LIMIT_WINDOW_MS, 
  config.RATE_LIMIT_BURST_MAX * 2, 
  config.RATE_LIMIT_BURST_WINDOW_MS
);
app.use(globalRateLimiter);

// Simple health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Get content type from registry or use default
    const contentType = monitoringService.register.contentType || 'text/plain; version=0.0.4; charset=utf-8';
    res.set('Content-Type', contentType);
    
    // Handle errors gracefully by wrapping in try/catch
    let metrics;
    try {
      metrics = await monitoringService.register.metrics();
    } catch (error) {
      console.error('Error generating metrics', error);
      metrics = '# Error generating metrics\n';
    }
    
    res.end(metrics);
  } catch (error) {
    console.error('Error in metrics endpoint', error);
    res.status(500).send('Error generating metrics');
  }
});

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cache', cacheRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;