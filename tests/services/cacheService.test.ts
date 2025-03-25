import { CacheService } from '../../src/services/cacheService';

describe('Cache Service', () => {
  let cacheService: CacheService<string, string>;
  
  beforeEach(() => {
    cacheService = new CacheService<string, string>({
      max: 10,
      ttl: 1000 // 1 second TTL for faster testing
    });
  });
  
  afterEach(() => {
    cacheService.shutdown();
  });

  describe('get', () => {
    it('should cache values and return them on subsequent calls', async () => {
      // Mock fetch function that simulates a DB call
      const fetchFn = jest.fn().mockResolvedValue('cached value');
      
      // First call should use the fetch function
      const value1 = await cacheService.get('key1', fetchFn);
      expect(value1).toBe('cached value');
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Second call should use the cached value
      const value2 = await cacheService.get('key1', fetchFn);
      expect(value2).toBe('cached value');
      expect(fetchFn).toHaveBeenCalledTimes(1); // Still only called once
    });
    
    it('should handle concurrent requests for the same key', async () => {
      // Create a slow fetch function
      const fetchFn = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve('cached value'), 100);
        });
      });
      
      // Make multiple concurrent requests
      const promises = Array(5).fill(0).map(() => 
        cacheService.get('concurrent-key', fetchFn)
      );
      
      // Wait for all requests to complete
      const results = await Promise.all(promises);
      
      // All results should be the same
      results.forEach(result => expect(result).toBe('cached value'));
      
      // The fetch function should have been called exactly once
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
    
    it('should respect TTL and refetch expired items', async () => {
      const fetchFn = jest.fn()
        .mockResolvedValueOnce('first value')
        .mockResolvedValueOnce('second value');
      
      // First call
      const value1 = await cacheService.get('ttl-key', fetchFn);
      expect(value1).toBe('first value');
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // After TTL, it should fetch again
      const value2 = await cacheService.get('ttl-key', fetchFn);
      expect(value2).toBe('second value');
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('invalidate', () => {
    it('should remove an item from the cache', async () => {
      const fetchFn = jest.fn().mockResolvedValue('value');
      
      // Cache a value
      await cacheService.get('invalid-key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Invalidate the key
      cacheService.invalidate('invalid-key');
      
      // Should fetch again
      await cacheService.get('invalid-key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getStats', () => {
    it('should track cache statistics correctly', async () => {
      const fetchFn = jest.fn().mockResolvedValue('stats value');
      
      // Cache a value (miss)
      await cacheService.get('stats-key', fetchFn);
      
      // Get it again (hit)
      await cacheService.get('stats-key', fetchFn);
      await cacheService.get('stats-key', fetchFn);
      
      // Get stats
      const stats = cacheService.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1); // 2/3 * 100 ≈ 66.67%
    });
  });
});