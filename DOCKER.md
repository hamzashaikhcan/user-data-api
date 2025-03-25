# Docker Setup for User Data API

This guide provides detailed instructions for running the User Data API using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Running in Production Mode

The production setup uses a pre-built application for optimal performance.

### Using Docker Compose (Recommended)

1. Start the entire stack (API and Redis):
   ```bash
   docker-compose up -d
   ```

2. Check the logs:
   ```bash
   docker-compose logs -f
   ```

3. Stop all services:
   ```bash
   docker-compose down
   ```

4. Stop services and remove volumes:
   ```bash
   docker-compose down -v
   ```

### Using Docker Build/Run (API Only)

If you prefer to build and run just the API container:

1. Build the image:
   ```bash
   docker build -t user-data-api .
   ```

2. Run with Redis connection:
   ```bash
   # If Redis is running locally on the host machine
   docker run -p 3000:3000 \
     -e REDIS_HOST=host.docker.internal \
     -e REDIS_PORT=6379 \
     -d user-data-api
   
   # If Redis is running in another container
   docker run -p 3000:3000 \
     -e REDIS_HOST=redis-container-name \
     -e REDIS_PORT=6379 \
     --network=your-docker-network \
     -d user-data-api
   ```

## Running in Development Mode

The development setup includes volume mounting for hot reloading.

1. Start the development stack:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. View logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. Code changes will be reflected automatically due to the volume mount and ts-node-dev.

## Environment Variables

You can customize these in docker-compose.yml or when running the container:

### Server Configuration
- `NODE_ENV`: Application environment (default: "production")
- `PORT`: Port to run the server on (default: 3000)

### Cache Configuration
- `CACHE_MAX_SIZE`: Maximum number of items in cache (default: 100)
- `CACHE_TTL_SECONDS`: Time-to-live for cache items in seconds (default: 60)

### Rate Limiting Configuration
- `RATE_LIMIT_MAX`: Maximum requests per minute (default: 10)
- `RATE_LIMIT_WINDOW_MS`: Window period in milliseconds (default: 60000)
- `RATE_LIMIT_BURST_MAX`: Maximum burst requests (default: 5)
- `RATE_LIMIT_BURST_WINDOW_MS`: Burst window in milliseconds (default: 10000)

### Redis Configuration
- `REDIS_HOST`: Redis server hostname (default: "redis" for docker-compose, "localhost" otherwise)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password if required (optional)

## Data Persistence

Redis data is persisted in a Docker volume named `redis-data`. This ensures that queue data is not lost when containers are restarted.

Logs are mounted from the host system into the container at `/usr/src/app/logs`.

## Docker Compose Services

The docker-compose.yml includes:

1. **api**: The User Data API service
   - Built from the local Dockerfile
   - Exposes port 3000
   - Depends on Redis
   - Persists logs to the host system

2. **redis**: Redis server for queue processing
   - Uses the official Redis Alpine image
   - Exposes port 6379
   - Persists data in a Docker volume

## Troubleshooting

### Redis Connection Issues

If the API can't connect to Redis, check:
1. The Redis service is running: `docker-compose ps`
2. Redis is accessible: `docker exec -it user-data-api_redis_1 redis-cli ping`
3. The REDIS_HOST and REDIS_PORT environment variables are correct

### Performance Issues

If you experience performance issues:
1. Check container resource constraints
2. Monitor container stats: `docker stats`
3. Consider using a production-grade Redis instance for heavy loads

### Container Logs

To view container logs:
```bash
# API logs
docker-compose logs api

# Redis logs
docker-compose logs redis

# Follow logs in real time
docker-compose logs -f
```