# Artillery Load Testing Instructions

1. Install Artillery in backend:
   cd backend && npm install --save-dev artillery

2. To run a basic load test:
   npm run load:test

3. The test hits /api/health and /api/ai/status with 5 requests/sec for 30 seconds.

4. Review the output for latency, errors, and throughput.

# See backend/artillery-basic.yml to customize scenarios.

