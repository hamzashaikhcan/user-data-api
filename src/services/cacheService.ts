import { LRUCache } from 'lru-cache';
import { CacheStatsTracker } from '../models/cacheStats';
import monitoringService from './monitoringService';

type CacheOptions = {
  max: number;
  ttl: number;
};

export class PendingRequest<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export class CacheService<K extends PropertyKey, V extends {}> {
  private cache: LRUCache<K, V>;
  private pendingRequests: Map<K, PendingRequest<V>> = new Map();
  private statsTracker: CacheStatsTracker;
  private cleanupInterval: NodeJS.Timeout;

  constructor(options: CacheOptions) {
    this.cache = new LRUCache<K, V>({
      max: options.max,
      ttl: options.ttl,
    });
    
    this.statsTracker = new CacheStatsTracker();
    
    // Setup background task to clean stale entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.ttl / 2);

    // Update Prometheus metrics with initial values
    monitoringService.metrics.cacheSize.set(0);
  }

  async get(key: K, fetchFn: () => Promise<V>): Promise<V> {
    const startTime = Date.now();
    const cachedValue = this.cache.get(key);

    if (cachedValue) {
      const responseTime = Date.now() - startTime;
      this.statsTracker.recordHit(responseTime);
      
      // Update monitoring metrics
      monitoringService.updateCacheMetrics(this.cache.size, true);
      
      return cachedValue;
    }

    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      const pendingRequest = this.pendingRequests.get(key)!;
      const value = await pendingRequest.promise;
      const responseTime = Date.now() - startTime;
      this.statsTracker.recordHit(responseTime);
      
      // Update monitoring metrics
      monitoringService.updateCacheMetrics(this.cache.size, true);
      
      return value;
    }

    // Create a new pending request
    const pendingRequest = new PendingRequest<V>();
    this.pendingRequests.set(key, pendingRequest);

    try {
      monitoringService.logger.debug(`Cache miss for key: ${String(key)}`);
      const value = await fetchFn();
      
      // Cache the result
      this.cache.set(key, value);
      
      // Resolve the pending request
      pendingRequest.resolve(value);
      
      // Record stats
      const responseTime = Date.now() - startTime;
      this.statsTracker.recordMiss(responseTime);
      
      // Update monitoring metrics
      monitoringService.updateCacheMetrics(this.cache.size, false);
      
      return value;
    } catch (error) {
      // Log the error
      monitoringService.logError(error as Error, { context: 'CacheService.get', key });
      
      pendingRequest.reject(error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  invalidate(key: K): void {
    monitoringService.logger.debug(`Invalidating cache for key: ${String(key)}`);
    this.cache.delete(key);
    monitoringService.metrics.cacheSize.set(this.cache.size);
  }

  clear(): void {
    monitoringService.logger.info('Clearing entire cache');
    this.cache.clear();
    monitoringService.metrics.cacheSize.set(0);
  }

  cleanup(): void {
    // LRUCache automatically handles expiration based on TTL,
    // but we can force a cleanup if needed
    monitoringService.logger.debug('Running cache cleanup');
    this.cache.purgeStale();
    monitoringService.metrics.cacheSize.set(this.cache.size);
  }

  getStats() {
    return this.statsTracker.getStats(
      this.cache.size,
      this.cache.max || 0
    );
  }

  shutdown(): void {
    monitoringService.logger.info('Shutting down cache service');
    clearInterval(this.cleanupInterval);
  }
}

// Create a singleton instance
const userCacheService = new CacheService<number, any>({
  max: 100, // Maximum 100 users in cache
  ttl: 60 * 1000, // 60 seconds TTL
});

export default userCacheService;