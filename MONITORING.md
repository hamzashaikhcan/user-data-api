# Monitoring Setup for User Data API

This document provides instructions for setting up and using the monitoring system for the User Data API.

## Overview

The User Data API includes a comprehensive monitoring solution that tracks:

- API performance metrics (request counts, response times)
- Cache performance (hits, misses, size)
- Queue statistics (active, completed, failed jobs)
- Rate limiting events
- Error rates and details

## Monitoring Components

### 1. Prometheus Metrics

The API exposes Prometheus-compatible metrics at the `/metrics` endpoint. These metrics can be scraped by a Prometheus server for storage and analysis.

Key metrics include:

- `http_requests_total` - Total number of HTTP requests
- `http_request_duration_seconds` - Duration of HTTP requests
- `cache_size` - Current number of items in cache
- `cache_hits_total` - Total number of cache hits
- `cache_misses_total` - Total number of cache misses
- `queue_jobs_total` - Jobs processed by queue
- `queue_jobs_waiting` - Jobs waiting in queue
- `queue_jobs_active` - Active jobs in queue
- `rate_limit_exceeded_total` - Rate limit exceeded events
- `errors_total` - API errors

### 2. Structured Logging

The API uses Winston for structured logging, with different log levels:

- `error` - Critical errors that require attention
- `warn` - Potential issues or unexpected behaviors
- `info` - General information about system operation
- `debug` - Detailed information for debugging purposes

Logs include contextual information like request details, error stacks, and performance metrics.

### 3. Response Time Headers

Each API response includes an `X-Response-Time` header showing the time taken to process the request in milliseconds.

## Setting Up Monitoring

### Local Development

For local development, logs are printed to the console with colorized formatting.

### Production Deployment

In production, logs are written to files:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### Setting Up Prometheus

#### Installing Prometheus on macOS

There are several ways to install Prometheus on macOS:

**Option 1: Using Homebrew (Recommended for macOS users)**

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Prometheus
brew install prometheus

# Start Prometheus with the default configuration
brew services start prometheus

# Or start it manually
prometheus --config.file=/usr/local/etc/prometheus.yml
```

**Option 2: Using the Binary Release**

1. Download the latest release for macOS from the [Prometheus downloads page](https://prometheus.io/download/)
   ```bash
   curl -LO https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.darwin-amd64.tar.gz
   ```

2. Extract the archive
   ```bash
   tar xvfz prometheus-2.45.0.darwin-amd64.tar.gz
   cd prometheus-2.45.0.darwin-amd64
   ```

3. Create or modify the Prometheus configuration file (prometheus.yml):
   ```yaml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'user-data-api'
       static_configs:
         - targets: ['localhost:3000']
   ```

4. Start Prometheus:
   ```bash
   ./prometheus --config.file=prometheus.yml
   ```

**Option 3: Using Docker**

```bash
# Pull the Prometheus Docker image
docker pull prom/prometheus

# Create a prometheus.yml file in your current directory
# Then run Prometheus container with that config
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

#### Prometheus Configuration

Regardless of your installation method, you'll need a configuration file (prometheus.yml) that tells Prometheus to scrape metrics from your User Data API:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'user-data-api'
    static_configs:
      - targets: ['localhost:3000']
```

If you're running the API using Docker, you'll need to adjust the target to make it reachable from the Prometheus instance:

```yaml
scrape_configs:
  - job_name: 'user-data-api'
    static_configs:
      - targets: ['user-data-api:3000']  # If using Docker Compose
      # OR
      - targets: ['host.docker.internal:3000']  # If Prometheus is in Docker but API is on host
```

Once Prometheus is running, you can access its UI at `http://localhost:9090`.

### Setting Up Grafana for Visualization

1. **Install Grafana on macOS**:
   ```bash
   # Using Homebrew
   brew install grafana

   # Start Grafana
   brew services start grafana
   ```

   Alternatively, download from [Grafana's website](https://grafana.com/grafana/download?platform=mac) or use Docker:
   ```bash
   docker run -d -p 3000:3000 grafana/grafana
   ```

2. **Access Grafana**:
   - Open `http://localhost:3000` in your browser
   - Default credentials are admin/admin

3. **Add Prometheus as a data source**:
   - Go to Configuration > Data Sources > Add data source
   - Select Prometheus
   - Set URL to `http://localhost:9090` (or appropriate URL if using Docker)
   - Click "Save & Test"

4. **Import the dashboard**:
   - Go to Create > Import
   - Upload the `grafana-dashboard.json` file from this repository
   - Or create your own dashboard using the metrics

## Example Grafana Dashboard

Below is a sample Grafana dashboard configuration you can use as a starting point:

1. **API Overview Panel**:
   - HTTP Request Rate (from `http_requests_total`)
   - Response Time (from `http_request_duration_seconds`)
   - Error Rate (from `errors_total`)

2. **Cache Performance Panel**:
   - Cache Size (from `cache_size`)
   - Cache Hit Ratio (calculated from `cache_hits_total` and `cache_misses_total`)
   - Cache Hit/Miss Rate over time

3. **Queue Panel**:
   - Active Jobs (from `queue_jobs_active`)
   - Job Completion Rate (from `queue_jobs_total`)
   - Failed Jobs (from `queue_jobs_total` with status="failed")

4. **Rate Limiting Panel**:
   - Rate Limit Exceeded Count (from `rate_limit_exceeded_total`)
   - Rate of rate limit events over time

## Using the Monitoring Dashboard

The monitoring dashboard provides real-time insights into the API's performance:

1. **Performance Tuning**: Monitor response times to identify bottlenecks
2. **Cache Optimization**: Analyze cache hit rates to adjust cache size or TTL
3. **Error Detection**: Quickly identify and diagnose errors
4. **Load Testing**: Observe system behavior under load to determine capacity limits

## Alerts and Notifications

You can set up alerts in Grafana for important events:

1. High error rates
2. Slow response times
3. Cache performance issues
4. Queue congestion

To set up an alert:
1. Edit a panel in Grafana
2. Go to the "Alert" tab
3. Configure conditions and notification channels

## Troubleshooting

### Common Prometheus Issues on macOS

1. **Port Conflicts**:
   - If port 9090 is already in use, you can specify a different port:
   ```bash
   prometheus --config.file=prometheus.yml --web.listen-address=:9091
   ```

2. **Firewall Issues**:
   - Ensure your macOS firewall allows connections to the required ports

3. **"Cannot connect to Prometheus" in Grafana**:
   - Check if Prometheus is running: `ps aux | grep prometheus`
   - Verify the URL in Grafana's data source configuration
   - Try using `localhost` instead of `127.0.0.1` or vice versa

### Checking If Prometheus Is Scraping Your API

1. Go to the Prometheus UI (http://localhost:9090)
2. Click "Status" > "Targets"
3. You should see your API endpoint (localhost:3000) with state "UP"
4. If not, check your network configuration and ensure the API is exposing the `/metrics` endpoint

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)