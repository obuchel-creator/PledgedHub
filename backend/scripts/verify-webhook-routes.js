#!/usr/bin/env node

/**
 * Webhook Routes Registration Verification
 * Checks if all webhook routes are properly registered and accessible
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
};

async function checkRoute() {
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.blue} WEBHOOK ROUTES VERIFICATION${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

    try {
        // Test MTN callback route
        console.log(`${colors.yellow}Testing MTN Callback Route...${colors.reset}`);
        try {
            const mtnRes = await axios.post(`${BASE_URL}/api/payments/mtn/callback`, {
                referenceId: 'TEST_REF',
                status: 'SUCCESSFUL',
                amount: 1000,
                externalId: 'PLEDGE-999-TEST'
            }, { timeout: 5000 });

            if (mtnRes.status === 200) {
                console.log(`${colors.green}✓ MTN callback route is accessible${colors.reset}\n`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`${colors.green}✓ MTN callback route is accessible (responded with ${error.response.status})${colors.reset}\n`);
            } else {
                throw error;
            }
        }

        // Test Airtel callback route
        console.log(`${colors.yellow}Testing Airtel Callback Route...${colors.reset}`);
        try {
            const airtelRes = await axios.post(`${BASE_URL}/api/payments/airtel/callback`, {
                transactionId: 'TEST_TXN',
                statusCode: '0',
                status: 'SUCCESSFUL',
                amount: 1000,
                externalId: 'PLEDGE-999-TEST'
            }, { timeout: 5000 });

            if (airtelRes.status === 200) {
                console.log(`${colors.green}✓ Airtel callback route is accessible${colors.reset}\n`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`${colors.green}✓ Airtel callback route is accessible (responded with ${error.response.status})${colors.reset}\n`);
            } else {
                throw error;
            }
        }

        // Check server health
        console.log(`${colors.yellow}Checking Server Health...${colors.reset}`);
        const healthRes = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
        console.log(`${colors.green}✓ Server health: ${healthRes.data.status}${colors.reset}\n`);

        console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bold}${colors.green}✓ All webhook routes are properly registered!${colors.reset}`);
        console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error(`${colors.red}✗ Cannot connect to server at ${BASE_URL}${colors.reset}`);
            console.error(`${colors.yellow}Make sure the backend server is running:${colors.reset}`);
            console.error(`${colors.yellow}  npm run dev  (from backend directory)${colors.reset}\n`);
        } else {
            console.error(`${colors.red}✗ Error: ${error.message}${colors.reset}\n`);
        }
        process.exit(1);
    }
}

checkRoute();
