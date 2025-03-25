import { Request, Response, NextFunction } from 'express';
import { advancedRateLimiter } from '../../src/middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Reset mocks for each test
    mockRequest = {
      ip: '127.0.0.1',
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    nextFunction = jest.fn();
  });
  
  afterAll(() => {
    // Reset env
    delete process.env.NODE_ENV;
  });
  
  it('should allow requests within rate limit', () => {
    // Create a rate limiter
    const limiter = advancedRateLimiter(10, 60000, 5, 10000);
    
    // Make a single request
    limiter(
      mockRequest as Request, 
      mockResponse as Response, 
      nextFunction
    );
    
    // Should call next without error
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
  
  it('should block requests when simulate header is provided', () => {
    // Create a rate limiter
    const limiter = advancedRateLimiter(10, 60000, 5, 10000);
    
    // Set header to simulate rate limit exceeded
    mockRequest.headers = {
      'x-test-simulate-rate-limit': 'true'
    };
    
    // Request should be blocked
    limiter(
      mockRequest as Request, 
      mockResponse as Response, 
      nextFunction
    );
    
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 429,
        message: expect.stringContaining('Rate limit exceeded')
      })
    );
  });
  
  it('should bypass rate limiting when bypass header is provided', () => {
    // Create a rate limiter
    const limiter = advancedRateLimiter(10, 60000, 1, 10000);
    
    // Set header to bypass rate limit
    mockRequest.headers = {
      'x-test-bypass-rate-limit': 'true'
    };
    
    // Make multiple requests that would normally exceed the limit
    for (let i = 0; i < 20; i++) {
      limiter(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
    }
    
    // All requests should pass
    expect(nextFunction).toHaveBeenCalledTimes(20);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});