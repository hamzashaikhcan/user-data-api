# Testing the User Data API with Postman

This guide explains how to use the provided Postman collection to test your User Data API.

## Setup

1. **Install Postman**:
   - Download and install Postman from [postman.com](https://www.postman.com/downloads/)

2. **Import the Collection and Environment**:
   - Open Postman
   - Click "Import" at the top left
   - Upload both files:
     - `User-Data-API.postman_collection.json`
     - `User-Data-API.postman_environment.json`

3. **Select the Environment**:
   - Choose "User Data API - Local" from the environment dropdown in the top right

4. **Start the API Server**:
   - Make sure your User Data API server is running at http://localhost:3000
   - If your server is running on a different URL, update the `baseUrl` variable in the environment

## Test Scenarios

The collection is organized into five main folders, each focusing on different aspects of the API:

### 1. User Endpoints

Test basic CRUD functionality for users:

- **Get User by ID**: Retrieves a user by ID
- **Get User by ID (Cached)**: Run this immediately after the first request to see caching in action
- **Get Non-existent User**: Tests error handling with a non-existent ID
- **Get All Users**: Retrieves all users
- **Create User**: Creates a new user
- **Create User (Invalid)**: Tests validation with invalid input

### 2. Cache Management

Test endpoints for managing and monitoring the cache:

- **Get Cache Status**: View cache statistics
- **Clear Cache**: Reset the cache
- **Get Queue Status**: View queue statistics
- **Get System Status**: View combined statistics

### 3. Monitoring

Test monitoring endpoints:

- **Get Prometheus Metrics**: Access Prometheus-compatible metrics
- **Get Health Status**: Check the API's health

### 4. Rate Limiting Tests

Test the rate limiting behavior:

1. Run the **Rapid Requests** endpoints in quick succession
2. By the 6th request, you should see a 429 Too Many Requests response
3. Wait a minute and try again - requests should work normally

### 5. Cache Performance Tests

Test and measure the performance benefits of caching:

1. Run **Clear Cache First** to reset the cache
2. Run **Uncached Request** - note the response time in the X-Response-Time header
3. Run **Cached Request** - compare the response time (should be significantly faster)
4. Check **Get Cache Statistics** to see the hits and misses

## What to Look For

1. **Response Times**:
   - Compare cached vs. uncached requests
   - Look for the X-Response-Time header in responses

2. **Cache Statistics**:
   - After some requests, check cache-status to see hit/miss counts
   - Clear the cache and observe the reset statistics

3. **Rate Limiting**:
   - When hitting the rate limit, observe the 429 status code
   - Note the helpful error message explaining the situation

4. **Error Handling**:
   - Test with invalid parameters or non-existent resources
   - Observe the consistent error format and meaningful messages

5. **Prometheus Metrics**:
   - Check the /metrics endpoint to see all tracked metrics
   - Look for HTTP request counts, durations, cache stats, etc.

## Using Postman Runner for Load Testing

To simulate high traffic and test rate limiting more thoroughly:

1. Click on the Rate Limiting Tests folder
2. Click the Runner button in the top right
3. Configure the run:
   - Set Iterations to 20
   - Set Delay to 0ms
   - Check "Save Responses"
4. Click the Run button
5. Observe the responses - you should see successful responses followed by 429 errors

## Tips

- **Check Headers**: Look at response headers for metadata like X-Response-Time
- **Monitor Console**: Watch your server console for logs during testing
- **Reset Between Tests**: Use the Clear Cache endpoint when testing cache behavior
- **Test Concurrency**: Run multiple requests simultaneously to see how the system handles it
- **Watch for Patterns**: Look for patterns in response times between cached and uncached requests
