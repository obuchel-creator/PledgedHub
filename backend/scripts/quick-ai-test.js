// Quick AI Test
const axios = require('axios');

async function quickTest() {
    try {
        console.log('Testing AI Status...');
        const response = await axios.get('http://localhost:5001/api/ai/status');
        console.log('\n✅ AI STATUS:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.available) {
            console.log('\n🎉 AI is working! Testing message generation...\n');
            
            // Test AI message generation
            const testResponse = await axios.post('http://localhost:5001/api/ai/test');
            console.log('✅ AI TEST RESULT:');
            console.log(JSON.stringify(testResponse.data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

quickTest();
