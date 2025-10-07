/**
 * Rate Limiting Test Script
 *
 * This script tests the rate limiting functionality by making multiple requests
 * to various endpoints and verifying that 429 (Too Many Requests) responses
 * are returned when limits are exceeded.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test configuration
const tests = [
  {
    name: 'Auth - Login (5 req/min)',
    endpoint: `${BASE_URL}/auth/login`,
    method: 'POST',
    data: { email: 'test@example.com', password: 'password123' },
    limit: 5,
    ttl: 60000,
  },
  {
    name: 'Auth - Register (3 req/min)',
    endpoint: `${BASE_URL}/auth/register`,
    method: 'POST',
    data: {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    },
    limit: 3,
    ttl: 60000,
  },
  {
    name: 'Service Search (50 req/min)',
    endpoint: `${BASE_URL}/services/search?latitude=10.762622&longitude=106.660172&radius=5000`,
    method: 'GET',
    limit: 50,
    ttl: 60000,
  },
  {
    name: 'Health Check (No limit - SkipThrottle)',
    endpoint: 'http://localhost:3000/health',
    method: 'GET',
    limit: 100, // Should not be rate limited
    ttl: 60000,
    skipThrottle: true,
  },
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

// Helper function to make a request and handle errors
async function makeRequest(config) {
  try {
    const response = await axios({
      method: config.method,
      url: config.endpoint,
      data: config.data,
      validateStatus: () => true, // Accept all status codes
    });
    return {
      status: response.status,
      headers: response.headers,
      rateLimitHeaders: {
        limit: response.headers['x-ratelimit-limit'],
        remaining: response.headers['x-ratelimit-remaining'],
        reset: response.headers['x-ratelimit-reset'],
      },
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      error: error.message,
    };
  }
}

// Test rate limiting for a specific endpoint
async function testRateLimit(config) {
  console.log(`\n${colors.bright}${colors.blue}Testing: ${config.name}${colors.reset}`);
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Expected limit: ${config.limit} requests per minute\n`);

  let requestsMade = 0;
  let rateLimitHit = false;
  let first429Response = null;

  // Make requests until rate limit is hit (or max attempts reached)
  const maxAttempts = config.limit + 5;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await makeRequest(config);
    requestsMade++;

    if (result.status === 429) {
      rateLimitHit = true;
      first429Response = result;
      console.log(`${colors.yellow}Request #${requestsMade}: ${colors.red}429 Too Many Requests${colors.reset}`);
      console.log(`Rate limit headers:`, result.rateLimitHeaders);
      break;
    } else {
      const statusColor = result.status < 300 ? colors.green : result.status < 400 ? colors.yellow : colors.red;
      console.log(`${colors.yellow}Request #${requestsMade}: ${statusColor}${result.status}${colors.reset}`);

      if (result.rateLimitHeaders.limit) {
        console.log(`  Rate limit: ${result.rateLimitHeaders.remaining}/${result.rateLimitHeaders.limit} remaining`);
      }
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print results
  console.log(`\n${colors.bright}Results:${colors.reset}`);
  if (config.skipThrottle) {
    if (!rateLimitHit && requestsMade > config.limit) {
      console.log(`${colors.green}✓ PASS: Health check is NOT rate limited (as expected)${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ FAIL: Health check was rate limited (should be skipped)${colors.reset}`);
    }
  } else {
    if (rateLimitHit) {
      const expectedHitPoint = config.limit + 1;
      if (requestsMade === expectedHitPoint) {
        console.log(`${colors.green}✓ PASS: Rate limit triggered at request #${requestsMade} (expected at #${expectedHitPoint})${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ PARTIAL: Rate limit triggered at request #${requestsMade} (expected at #${expectedHitPoint})${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗ FAIL: Rate limit NOT triggered after ${requestsMade} requests${colors.reset}`);
    }
  }

  console.log('─'.repeat(80));
}

// Main test runner
async function runTests() {
  console.log(`${colors.bright}${colors.blue}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║        Rate Limiting Test - Location-Based Services          ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}⚠ NOTE: Make sure the application is running on http://localhost:3000${colors.reset}\n`);

  // Check if server is running
  try {
    await axios.get('http://localhost:3000/health');
    console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Server is not running. Please start the application first.${colors.reset}`);
    console.log(`${colors.yellow}  Run: npm run start:dev${colors.reset}\n`);
    process.exit(1);
  }

  // Run all tests
  for (const test of tests) {
    await testRateLimit(test);

    // Wait a bit between different endpoint tests
    if (tests.indexOf(test) < tests.length - 1) {
      console.log(`\n${colors.yellow}Waiting 2 seconds before next test...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${colors.bright}${colors.green}All tests completed!${colors.reset}\n`);

  // Summary
  console.log(`${colors.bright}Rate Limiting Configuration Summary:${colors.reset}`);
  console.log(`- Auth endpoints (login): 5 req/min`);
  console.log(`- Auth endpoints (register): 3 req/min`);
  console.log(`- Auth endpoints (refresh): 10 req/min`);
  console.log(`- Password reset endpoints: 3 req/min`);
  console.log(`- Search operations: 50 req/min`);
  console.log(`- Write operations (POST/PUT/DELETE): 20 req/min`);
  console.log(`- Read operations (GET): 100 req/min (default)`);
  console.log(`- Health checks: No limit (SkipThrottle)`);
}

// Run the tests
runTests().catch(console.error);
