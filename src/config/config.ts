import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  CACHE_MAX_SIZE: number;
  CACHE_TTL_SECONDS: number;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_BURST_MAX: number;
  RATE_LIMIT_BURST_WINDOW_MS: number;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
}

// Define default values
const DEFAULT_CONFIG: EnvConfig = {
  NODE_ENV: 'development',
  PORT: 3000,
  CACHE_MAX_SIZE: 100,
  CACHE_TTL_SECONDS: 60,
  RATE_LIMIT_MAX: 10,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_BURST_MAX: 5,
  RATE_LIMIT_BURST_WINDOW_MS: 10000, // 10 seconds
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379
};

// Parse environment variables
const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || DEFAULT_CONFIG.NODE_ENV,
  PORT: parseInt(process.env.PORT || `${DEFAULT_CONFIG.PORT}`, 10),
  CACHE_MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE || `${DEFAULT_CONFIG.CACHE_MAX_SIZE}`, 10),
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || `${DEFAULT_CONFIG.CACHE_TTL_SECONDS}`, 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || `${DEFAULT_CONFIG.RATE_LIMIT_MAX}`, 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${DEFAULT_CONFIG.RATE_LIMIT_WINDOW_MS}`, 10),
  RATE_LIMIT_BURST_MAX: parseInt(process.env.RATE_LIMIT_BURST_MAX || `${DEFAULT_CONFIG.RATE_LIMIT_BURST_MAX}`, 10),
  RATE_LIMIT_BURST_WINDOW_MS: parseInt(process.env.RATE_LIMIT_BURST_WINDOW_MS || `${DEFAULT_CONFIG.RATE_LIMIT_BURST_WINDOW_MS}`, 10),
  REDIS_HOST: process.env.REDIS_HOST || DEFAULT_CONFIG.REDIS_HOST,
  REDIS_PORT: parseInt(process.env.REDIS_PORT || `${DEFAULT_CONFIG.REDIS_PORT}`, 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD
};

export default config;