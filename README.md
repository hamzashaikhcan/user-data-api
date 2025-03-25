# User Data API with Advanced Caching, Rate Limiting, and Asynchronous Processing

An Express.js API that serves user data with advanced caching strategies, rate limiting, and asynchronous processing to handle high traffic and improve performance.

## Features

- **TypeScript Integration**: Type-safe codebase for better maintainability and developer experience.
- **Advanced LRU Cache**: Implements Least Recently Used (LRU) caching strategy with automatic invalidation.
- **Concurrent Request Handling**: Efficiently handles concurrent requests for the same resource.
- **Sophisticated Rate Limiting**: Implements both standard and burst rate limiting for better traffic management.
- **Asynchronous Processing**: Uses Bull queues for non-blocking asynchronous operations.
- **Performance Monitoring**: Comprehensive monitoring solution with Prometheus metrics, structured logging, and Grafana dashboards.
- **Graceful Shutdown**: Properly handles application termination with cleanup.

## Architecture

The application follows a modular architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and interact with data sources
- **Middleware**: Process requests before they reach route handlers
- **Routes**: Define API endpoints and map them to controllers
- **Models**: Define data structures and interfaces
- **Config**: Store application configuration settings
- **Monitoring**: Tracks system performance and health

## Running the Application

You have multiple options to run the application:

### Option 1: Local Setup with Node.js

#### Prerequisites

- Node.js (v16+)
- npm or yarn
- Redis (optional, see [README-REDIS.md](README-REDIS.md) for setup instructions)

#### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:hamzashaikhcan/user-data-api.git
   cd user-data-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables (or use the defaults):
   ```
   NODE_ENV=development
   PORT=3000
   CACHE_MAX_SIZE=100
   CACHE_TTL_SECONDS=60
   RATE_LIMIT_MAX=10
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_BURST_MAX=5
   RATE_LIMIT_BURST_WINDOW_MS=10000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. Start the application:
   ```bash
   npm run build
   npm start
   ```

   For development mode:
   ```bash
   npm run dev
   ```

### Option 2: Docker Setup (Recommended)

#### Prerequisites

- Docker and Docker Compose

#### Running with Docker Compose

1. Clone the repository:
   ```bash
   git clone git@github.com:hamzashaikhcan/user-data-api.git
   cd user-data-api
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - The User Data API on port 3000
   - Redis for queue processing on port 6379

3. Monitor the logs:
   ```bash
   docker-compose logs -f
   ```

#### Building and Running Only the API (using local Redis)

If you have Redis running locally, you can just build and run the API container:

1. Build the Docker image:
   ```bash
   docker build -t user-data-api .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e REDIS_HOST=host.docker.internal \
     -e REDIS_PORT=6379 \
     -d user-data-api
   ```

   Note: `host.docker.internal` is a special DNS name that resolves to the host machine IP from inside the container on macOS and Windows. On Linux, you might need to use the host's actual IP address or network options.

#### Environment Variables

You can customize the Docker container by setting environment variables:

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e REDIS_HOST=your-redis-host \
  -e REDIS_PORT=6379 \
  -e CACHE_MAX_SIZE=200 \
  -e CACHE_TTL_SECONDS=120 \
  -d user-data-api
```

## API Documentation

### User Endpoints

#### `GET /api/v1/users/:id`
Retrieves a user by ID.

**Response:**
- `200 OK`: Returns the user object.
- `404 Not Found`: User not found.
- `429 Too Many Requests`: Rate limit exceeded.

#### `POST /api/v1/users`
Creates a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
- `201 Created`: Returns the created user object.
- `400 Bad Request`: Invalid input data.
- `429 Too Many Requests`: Rate limit exceeded.

#### `GET /api/v1/users`
Retrieves all users.

**Response:**
- `200 OK`: Returns an array of user objects.
- `429 Too Many Requests`: Rate limit exceeded.

### Cache Management Endpoints

#### `GET /api/v1/cache/status`
Returns current cache statistics.

**Response:**
- `200 OK`: Returns cache statistics including hits, misses, and size.

#### `DELETE /api/v1/cache`
Clears the entire cache.

**Response:**
- `200 OK`: Cache cleared successfully.

#### `GET /api/v1/cache/queue`
Returns current queue statistics.

**Response:**
- `200 OK`: Returns queue statistics.

#### `GET /api/v1/cache/system`
Returns combined system statistics including cache and queue information.

**Response:**
- `200 OK`: Returns system statistics.

### Monitoring Endpoints

#### `GET /metrics`
Returns Prometheus-compatible metrics.

**Response:**
- `200 OK`: Returns metrics in Prometheus format.

#### `GET /health`
Returns the API health status.

**Response:**
- `200 OK`: API is running.

## Testing

### Running Tests

1. Run all tests:
   ```bash
   npm test
   ```

2. Run tests with coverage report:
   ```bash
   npm run test:coverage
   ```

### Using Postman for API Testing

See [POSTMAN-TESTING.md](postman_collection/POSTMAN-TESTING.md) for detailed instructions on testing the API with Postman.

## Monitoring Setup

The API includes a comprehensive monitoring solution. For detailed setup instructions, see [MONITORING.md](MONITORING.md).

## Redis Configuration

For information about Redis setup and configuration, see [README-REDIS.md](README-REDIS.md).

## Implementation Details

### Caching Strategy

The application uses an LRU (Least Recently Used) cache with the following characteristics:

- **Time-Based Expiration**: Cache entries expire after 60 seconds.
- **Size Limit**: Maximum of 100 entries to prevent memory issues.
- **Concurrent Request Handling**: Uses a pending request map to avoid the thundering herd problem.
- **Automatic Cleanup**: Background task that removes stale cache entries.

### Rate Limiting Implementation

The API implements a two-tier rate limiting strategy:

- **Standard Rate Limiting**: Limits users to 10 requests per minute.
- **Burst Control**: Additional limit of 5 requests within a 10-second window to prevent short bursts.
- **IP-Based Tracking**: Identifies clients by IP address.

### Asynchronous Processing

Implemented using Bull, a Redis-based queue:

- **Non-Blocking Operations**: Database operations are processed asynchronously.
- **Job Management**: Failed jobs are retained for debugging purposes.
- **Graceful Shutdown**: Ensures all jobs are properly processed before application termination.

### Monitoring Implementation

Comprehensive monitoring solution:

- **Prometheus Integration**: Collects and exposes metrics for scraping.
- **Winston Logging**: Structured logs with different levels and formats.
- **Response Time Tracking**: Performance metrics for all API endpoints.
- **Grafana Dashboard**: Visualization of system performance.

## License

[MIT](LICENSE)