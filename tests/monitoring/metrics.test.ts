import request from 'supertest';
import app from '../../src/app';
import monitoringService from '../../src/services/monitoringService';

describe('Monitoring System', () => {
  beforeEach(async () => {
    // Reset metrics before each test
    await monitoringService.resetMetrics();
  });
  
  describe('Metrics Endpoint', () => {
    it('should expose Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .set('x-test-bypass-rate-limit', 'true');
      
      // Expect success response
      expect(response.status).toBe(200);
      
      // Basic verification
      expect(response.text).toBeTruthy();
      expect(typeof response.text).toBe('string');
    });
  });
  
  describe('Request Tracking', () => {
    it('should handle API requests without errors', async () => {
      // Make a test request - just verify it doesn't crash
      const response = await request(app)
        .get('/api/v1/users/1')
        .set('x-test-bypass-rate-limit', 'true');
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Make a request that generates an error
      const response = await request(app)
        .get('/api/v1/users/999')
        .set('x-test-bypass-rate-limit', 'true');
      
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });
  
  describe('Cache Operations', () => {
    it('should handle cache operations', async () => {
      // First request - cache miss
      await request(app)
        .get('/api/v1/users/1')
        .set('x-test-bypass-rate-limit', 'true');
      
      // Second request - cache hit
      const response = await request(app)
        .get('/api/v1/users/1')
        .set('x-test-bypass-rate-limit', 'true');
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Request with simulated rate limit
      const response = await request(app)
        .get('/api/v1/users/1')
        .set('x-test-simulate-rate-limit', 'true');
      
      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Rate limit exceeded');
    });
  });
});