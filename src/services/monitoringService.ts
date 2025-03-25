import { Request, Response, NextFunction } from 'express';
import { Counter, Gauge, Histogram, Registry, register } from 'prom-client';
import responseTime from 'response-time';
import winston from 'winston';

// Flag to track if default metrics have been registered
let defaultMetricsRegistered = false;

// Use a separate registry for tests to avoid conflicts
const isTest = process.env.NODE_ENV === 'test';
const metricsRegistry = isTest ? new Registry() : register;

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-data-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => {
          const { timestamp, level, message, ...meta } = info;
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    }),
    // Write important logs to file in production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' })
        ]
      : [])
  ]
});

// Initialize default metrics - only once!
function initializeDefaultMetrics() {
  if (!isTest && !defaultMetricsRegistered) {
    try {
      // Clear any existing metrics first
      metricsRegistry.clear();
      
      // Now register default metrics
      require('prom-client').collectDefaultMetrics({ 
        register: metricsRegistry, 
        prefix: 'user_data_api_' 
      });
      
      defaultMetricsRegistered = true;
      logger.info('Prometheus default metrics initialized');
    } catch (error) {
      logger.error('Failed to initialize default metrics', { error });
    }
  }
}

// Initialize metrics at module load time
initializeDefaultMetrics();

// Safely create metrics - only if they don't already exist
const getOrCreateMetric = (
  type: 'counter' | 'gauge' | 'histogram',
  name: string, 
  help: string, 
  labelNames: string[] = [],
  buckets?: number[]
) => {
  try {
    // Check if metric exists first
    const existingMetric = metricsRegistry.getSingleMetric(name);
    if (existingMetric) return existingMetric;
    
    // If not, create a new one
    if (type === 'counter') {
      return new Counter({ name, help, labelNames, registers: [metricsRegistry] });
    } else if (type === 'gauge') {
      return new Gauge({ name, help, labelNames, registers: [metricsRegistry] });
    } else if (type === 'histogram') {
      return new Histogram({ name, help, labelNames, buckets, registers: [metricsRegistry] });
    }
  } catch (error) {
    logger.error(`Error creating metric ${name}`, { error });
    // Return a mock metric that won't break code
    return {
      inc: () => {},
      set: () => {},
      observe: () => {},
      labels: () => ({
        inc: () => {},
        set: () => {},
        observe: () => {}
      })
    };
  }
};

// Prometheus metrics
export const metrics = {
  // API request metrics
  httpRequestsTotal: getOrCreateMetric(
    'counter',
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'route', 'status_code']
  ) as Counter<string>,

  httpRequestDurationSeconds: getOrCreateMetric(
    'histogram',
    'http_request_duration_seconds',
    'Duration of HTTP requests in seconds',
    ['method', 'route', 'status_code'],
    [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
  ) as Histogram<string>,

  // Cache metrics
  cacheSize: getOrCreateMetric(
    'gauge',
    'cache_size',
    'Current number of items in cache'
  ) as Gauge<string>,

  cacheHits: getOrCreateMetric(
    'counter',
    'cache_hits_total',
    'Total number of cache hits'
  ) as Counter<string>,

  cacheMisses: getOrCreateMetric(
    'counter',
    'cache_misses_total',
    'Total number of cache misses'
  ) as Counter<string>,

  // Queue metrics
  queueJobsTotal: getOrCreateMetric(
    'counter',
    'queue_jobs_total',
    'Total number of jobs processed by queue',
    ['queue', 'status']
  ) as Counter<string>,

  queueJobsWaiting: getOrCreateMetric(
    'gauge',
    'queue_jobs_waiting',
    'Current number of jobs waiting in queue',
    ['queue']
  ) as Gauge<string>,

  queueJobsActive: getOrCreateMetric(
    'gauge',
    'queue_jobs_active',
    'Current number of active jobs in queue',
    ['queue']
  ) as Gauge<string>,

  // Rate limiting metrics
  rateLimitExceeded: getOrCreateMetric(
    'counter',
    'rate_limit_exceeded_total',
    'Total number of requests that exceeded rate limit'
  ) as Counter<string>,

  // Error metrics
  errorsTotal: getOrCreateMetric(
    'counter',
    'errors_total',
    'Total number of errors',
    ['type']
  ) as Counter<string>
};

// Create a custom metrics middleware
export const prometheusMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip in test environment
  if (isTest) {
    return next();
  }
  
  // Record start time for calculating duration
  const start = Date.now();
  
  // Record request once it's complete
  const recordRequest = () => {
    // Remove event listeners to prevent memory leaks
    res.removeListener('finish', recordRequest);
    res.removeListener('close', recordRequest);
    
    // Get normalized path
    const path = req.route?.path || req.path || 'unknown';
    
    // Calculate duration
    const duration = (Date.now() - start) / 1000;
    
    try {
      // Record request count
      metrics.httpRequestsTotal.labels(req.method, path, res.statusCode.toString()).inc();
      
      // Record request duration
      metrics.httpRequestDurationSeconds.labels(req.method, path, res.statusCode.toString()).observe(duration);
    } catch (error) {
      logger.error('Error recording metrics for request', { error, path, method: req.method, statusCode: res.statusCode });
    }
  };
  
  // Record metrics when the response is sent or closed
  res.on('finish', recordRequest);
  res.on('close', recordRequest);
  
  next();
};

// Middleware to track response time with Winston and Prometheus
export const responseTimeMiddleware = responseTime((req: Request, res: Response, time: number) => {
  if (isTest) return; // Skip in test environment
  
  const path = req.route ? req.route.path : req.path;
  const method = req.method;
  const statusCode = res.statusCode.toString();

  // Log response time
  logger.debug(`${method} ${path} ${statusCode} - ${time.toFixed(2)}ms`);
});

// Middleware to log all HTTP requests
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (isTest) {
    return next(); // Skip in test environment
  }
  
  // Log at the start of the request
  logger.info(`${req.method} ${req.url} started`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log when the response is finished
  res.on('finish', () => {
    const logMethod = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logMethod](`${req.method} ${req.url} ${res.statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      contentLength: res.get('content-length'),
      responseTime: res.get('x-response-time')
    });

    // Track rate limit exceeded
    if (res.statusCode === 429) {
      try {
        metrics.rateLimitExceeded.inc();
      } catch (error) {
        logger.error('Error incrementing rate limit metric', { error });
      }
    }
  });

  next();
};

// Error logging function
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    error,
    stack: error.stack,
    ...context
  });

  // Increment error counter
  try {
    metrics.errorsTotal.labels(error.name || 'unknown').inc();
  } catch (err) {
    logger.error('Error incrementing error metric', { err });
  }
};

// Update cache metrics
export const updateCacheMetrics = (size: number, isHit: boolean) => {
  try {
    metrics.cacheSize.set(size);
    
    if (isHit) {
      metrics.cacheHits.inc();
    } else {
      metrics.cacheMisses.inc();
    }
  } catch (error) {
    logger.error('Error updating cache metrics', { error, size, isHit });
  }
};

// Update queue metrics
export const updateQueueMetrics = (queueName: string, counts: Record<string, number>) => {
  try {
    // Safely access properties with type checking
    const waiting = counts.waiting ?? 0;
    const active = counts.active ?? 0;
    const completed = counts.completed ?? 0;
    const failed = counts.failed ?? 0;
  
    metrics.queueJobsWaiting.labels(queueName).set(waiting);
    metrics.queueJobsActive.labels(queueName).set(active);
    
    // Only track completed/failed if they're present
    if (completed > 0) {
      metrics.queueJobsTotal.labels(queueName, 'completed').inc(completed);
    }
    
    if (failed > 0) {
      metrics.queueJobsTotal.labels(queueName, 'failed').inc(failed);
    }
  } catch (error) {
    logger.error('Error updating queue metrics', { error, queueName });
  }
};

// For testing: reset all metrics
export const resetMetrics = async () => {
  if (isTest) {
    try {
      await metricsRegistry.resetMetrics();
      defaultMetricsRegistered = false;
    } catch (error) {
      logger.error('Error resetting metrics', { error });
    }
  }
};

export default {
  logger,
  metrics,
  prometheusMiddleware,
  responseTimeMiddleware,
  requestLoggerMiddleware,
  logError,
  updateCacheMetrics,
  updateQueueMetrics,
  resetMetrics,
  register: metricsRegistry
};