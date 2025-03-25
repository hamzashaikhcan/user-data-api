# Redis Configuration for User Data API

## Overview

The User Data API uses Redis as a backend for the Bull queue system, which handles asynchronous processing. While the application includes fallback mechanisms for running without Redis, the full functionality is best experienced with Redis enabled.

## Redis Installation

### For macOS:

Using Homebrew:
```bash
brew install redis
brew services start redis
```

### For Windows:

1. Download the Redis for Windows package from GitHub or use Windows Subsystem for Linux (WSL)
2. Install and start the Redis service

### For Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### Using Docker:

```bash
docker run --name redis -p 6379:6379 -d redis
```

## Verifying Redis Installation

To verify Redis is running correctly:

```bash
redis-cli ping
```

This should return `PONG` if Redis is running properly.

## Redis Configuration

By default, the application connects to Redis at `localhost:6379`. This can be customized by setting the following environment variables:

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_needed
```

## Running Without Redis

The application includes a fallback mechanism that uses in-memory queues when Redis is unavailable. This allows you to run and test the API even without Redis, but with the following limitations:

1. Job persistence is not available (jobs are lost if the server restarts)
2. Distributed processing is not possible
3. Some advanced Bull features (delayed jobs, job prioritization) are simplified

The API will automatically detect if Redis is unavailable and switch to the fallback mode with appropriate logging. You can check the queue status endpoint to see if Redis is being used:

```
GET /api/v1/cache/queue
```

The response will include an `isUsingRedis` field indicating whether the application is using Redis or the fallback mechanism.

## Troubleshooting

If you encounter the error `connect ECONNREFUSED 127.0.0.1:6379`, it means Redis is not running or not accessible. Check:

1. Redis service status: `redis-cli ping` or `systemctl status redis` (Linux)
2. Firewall settings (port 6379 should be accessible)
3. Redis configuration (bind address and port)

For more Redis troubleshooting, refer to the [Redis documentation](https://redis.io/documentation).