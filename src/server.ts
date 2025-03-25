import app from './app';
import config from './config/config';
import cacheService from './services/cacheService';
import queueService from './services/queueService';

const PORT = config.PORT;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`
======================================
🚀 Server started in ${config.NODE_ENV} mode
📡 API running on port ${PORT}
⚙️ Cache TTL: ${config.CACHE_TTL_SECONDS} seconds
🚦 Rate limit: ${config.RATE_LIMIT_MAX} requests per ${config.RATE_LIMIT_WINDOW_MS / 1000} seconds
======================================
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    // Shutdown services
    cacheService.shutdown();
    await queueService.shutdown();
    
    console.log('All services shut down gracefully.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    // Shutdown services
    cacheService.shutdown();
    await queueService.shutdown();
    
    console.log('All services shut down gracefully.');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  
  server.close(() => {
    process.exit(1);
  });
});

export default server;