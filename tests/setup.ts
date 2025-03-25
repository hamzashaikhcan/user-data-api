import queueService from '../src/services/queueService';
import cacheService from '../src/services/cacheService';
import monitoringService from '../src/services/monitoringService';

// Set test environment globally
process.env.NODE_ENV = 'test';

// Global setup before all tests
beforeAll(async () => {
  // Initialize any test resources if needed
  console.log('Setting up test environment...');
  
  // Reset metrics before starting tests
  await monitoringService.resetMetrics();
});

// Global teardown after all tests
afterAll(async () => {
  // Clean up resources
  console.log('Cleaning up test environment...');
  await queueService.shutdown();
  cacheService.shutdown();
  
  // Add delay to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Reset between each test
beforeEach(async () => {
  // Clear cache for clean test slate
  cacheService.clear();
  
  // Reset metrics between tests
  await monitoringService.resetMetrics();
});

// Increase Jest timeout for all tests
jest.setTimeout(30000); // 30 seconds