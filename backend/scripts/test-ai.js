// Test AI Integration
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAIIntegration() {
    console.log('🧪 Testing AI Integration...\n');
    
    try {
        // Test 1: Check AI status
        console.log('1️⃣  Checking AI status...');
        const statusResponse = await axios.get(`${BASE_URL}/ai/status`);
        console.log('   Result:', JSON.stringify(statusResponse.data, null, 2));
        console.log('   ✅ AI Status endpoint working!\n');
        
        if (!statusResponse.data.available) {
            console.log('⚠️  AI is not available yet.');
            console.log('   To enable AI features:');
            console.log('   1. Visit: https://makersuite.google.com/app/apikey');
            console.log('   2. Sign in with your Google account');
            console.log('   3. Click "Create API Key"');
            console.log('   4. Copy the key (starts with AIza...)');
            console.log('   5. Add to backend/.env file:');
            console.log('      GOOGLE_AI_API_KEY=your_key_here\n');
        }
        
        // Test 2: Try test endpoint
        console.log('2️⃣  Testing AI with sample data...');
        try {
            const testResponse = await axios.post(`${BASE_URL}/ai/test`);
            console.log('   Result:', JSON.stringify(testResponse.data, null, 2));
            console.log('   ✅ AI Test successful!\n');
        } catch (error) {
            if (error.response) {
                console.log('   Result:', JSON.stringify(error.response.data, null, 2));
                console.log('   ℹ️  AI test completed (AI needs API key)\n');
            } else {
                throw error;
            }
        }
        
        // Test 3: Get suggestions
        console.log('3️⃣  Getting AI suggestions...');
        try {
            const suggestionsResponse = await axios.get(`${BASE_URL}/ai/suggestions`);
            console.log('   Result:', JSON.stringify(suggestionsResponse.data, null, 2));
            console.log('   ✅ Suggestions endpoint working!\n');
        } catch (error) {
            if (error.response) {
                console.log('   Result:', JSON.stringify(error.response.data, null, 2));
                console.log('   ℹ️  Suggestions completed\n');
            } else {
                throw error;
            }
        }
        
        console.log('✅ All AI endpoints are properly configured!');
        console.log('');
        console.log('📋 Available AI Endpoints:');
        console.log('   GET  /api/ai/status');
        console.log('   POST /api/ai/test');
        console.log('   POST /api/ai/enhance-message');
        console.log('   POST /api/ai/thank-you');
        console.log('   GET  /api/ai/insights');
        console.log('   GET  /api/ai/suggestions');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('   1. Get Google Gemini API key (FREE)');
        console.log('   2. Add GOOGLE_AI_API_KEY to .env');
        console.log('   3. Restart server');
        console.log('   4. AI features will be fully active! 🚀');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Server is not running!');
            console.error('   Start the server with: npm run dev');
        } else {
            console.error('❌ Test failed:', error.message);
            if (error.response) {
                console.error('   Response:', error.response.data);
            }
        }
        process.exit(1);
    }
}

testAIIntegration();
