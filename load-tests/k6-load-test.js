import http from 'k6/http';
import { check, sleep } from 'k6';

// ==============================================================================
// Momentra (HDAM) — k6 Performance & Load Benchmark Script
// Verifying NFR-PERF-01 (Search < 800ms), NFR-PERF-03 (P95 < 300ms), NFR-SCALE-01 (1,000 VUs)
// ==============================================================================

export const options = {
  stages: [
    { duration: '20s', target: 100 },  // 1. Warm-up to 100 users
    { duration: '40s', target: 500 },  // 2. Scale to 500 users
    { duration: '1m',  target: 1000 }, // 3. Peak load at 1,000 concurrent users
    { duration: '1m',  target: 1000 }, // 4. Sustained 1,000 user stress test
    { duration: '20s', target: 0 },    // 5. Cool-down
  ],
  thresholds: {
    // NFR-PERF-03: API Latency P95 must be under 300ms
    'http_req_duration{endpoint:timeline}': ['p(95)<300', 'p(99)<600'],
    // NFR-PERF-01: Complex Thai Search Latency P95 under 500ms
    'http_req_duration{endpoint:search}':   ['p(95)<500', 'p(99)<800'],
    // Overall Error rate must be under 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-Workspace-Id': WORKSPACE_ID,
    'Accept-Language': 'th-TH,th;q=0.9',
  };

  // 1. Test Timeline Viewport Aggregation
  {
    const from = '1930-01-01T00:00:00Z';
    const to = '1945-12-31T23:59:59Z';
    const url = `${BASE_URL}/api/v1/timeline?from=${from}&to=${to}&granularity=year&calendar=be`;

    const res = http.get(url, {
      headers,
      tags: { endpoint: 'timeline' },
    });

    check(res, {
      'timeline status is 200': (r) => r.status === 200,
      'timeline response time < 300ms': (r) => r.timings.duration < 300,
    });
  }

  sleep(0.5);

  // 2. Test Full-Text Bilingual Search
  {
    const searchTerms = ['รัฐธรรมนูญ', 'สมเด็จพระพุฒาจารย์', 'สะพานพุทธ', '2475', 'map'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const url = `${BASE_URL}/api/v1/search?q=${encodeURIComponent(term)}&limit=20`;

    const res = http.get(url, {
      headers,
      tags: { endpoint: 'search' },
    });

    check(res, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 500ms': (r) => r.timings.duration < 500,
    });
  }

  sleep(1);
}
