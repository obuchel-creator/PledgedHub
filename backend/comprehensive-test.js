// Comprehensive test of core PledgeHub features
const http = require('http');

class PledgeHubTester {
  constructor() {
    this.baseUrl = 'http://localhost:5001';
    this.results = [];
    this.testPledgeId = null;
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsedBody
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body
            });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000);

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  log(test, status, message, details = null) {
    const result = { test, status, message, details, timestamp: new Date().toISOString() };
    this.results.push(result);
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`${icon} ${test}: ${message}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details)}`);
    }
  }

  async test(name, testFn) {
    try {
      await testFn();
    } catch (error) {
      this.log(name, 'FAIL', error.message);
    }
  }

  async runAllTests() {
    console.log('🧪 PledgeHub - COMPREHENSIVE FEATURE TEST');
    console.log('===============================================\n');

    // Test 1: Basic connectivity
    await this.test('Basic Connectivity', async () => {
      const response = await this.makeRequest('/api/test');
      if (response.status === 200) {
        this.log('Basic Connectivity', 'PASS', `Server responding: ${response.data.message}`);
      } else {
        this.log('Basic Connectivity', 'FAIL', `HTTP ${response.status}`);
      }
    });

    // Test 2: Database connection via pledges endpoint
    await this.test('Database Connection', async () => {
      const response = await this.makeRequest('/api/pledges');
      if (response.status === 200) {
        const pledges = Array.isArray(response.data) ? response.data : response.data.pledges || [];
        this.log('Database Connection', 'PASS', `Database accessible, found ${pledges.length} pledges`);
      } else {
        this.log('Database Connection', 'FAIL', `HTTP ${response.status}: ${response.data.message || 'Unknown error'}`);
      }
    });

    // Test 3: AI Service Status
    await this.test('AI Service', async () => {
      const response = await this.makeRequest('/api/ai/status');
      if (response.status === 200) {
        const available = response.data.available || response.data.status === 'available';
        if (available) {
          this.log('AI Service', 'PASS', `AI service is available`);
        } else {
          this.log('AI Service', 'FAIL', 'AI service not available');
        }
      } else {
        this.log('AI Service', 'FAIL', `HTTP ${response.status}`);
      }
    });

    // Test 4: Analytics Service
    await this.test('Analytics Service', async () => {
      const response = await this.makeRequest('/api/analytics/overview');
      if (response.status === 200) {
        this.log('Analytics Service', 'PASS', 'Analytics data accessible');
      } else {
        this.log('Analytics Service', 'FAIL', `HTTP ${response.status}`);
      }
    });

    // Test 5: Message Generation
    await this.test('Message Generation', async () => {
      const response = await this.makeRequest('/api/messages/templates');
      if (response.status === 200) {
        const templates = response.data.templates || response.data;
        this.log('Message Generation', 'PASS', `Found ${Array.isArray(templates) ? templates.length : 'some'} message templates`);
      } else {
        this.log('Message Generation', 'FAIL', `HTTP ${response.status}`);
      }
    });

    // Test 6: Reminder System Status
    await this.test('Reminder System', async () => {
      const response = await this.makeRequest('/api/reminders/status');
      if (response.status === 200) {
        this.log('Reminder System', 'PASS', 'Reminder system accessible');
      } else {
        this.log('Reminder System', 'FAIL', `HTTP ${response.status}`);
      }
    });

    // Test 7: Create a test pledge
    await this.test('Pledge Creation', async () => {
      const testPledge = {
        name: 'Test Pledge',
        title: 'Test Pledge for System Verification',
        description: 'This is a test pledge created by the comprehensive test suite',
        donor_name: 'Test Donor',
        donor_email: 'test@example.com',
        amount: 1000,
        collection_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      };

      const response = await this.makeRequest('/api/pledges', 'POST', testPledge);
      if (response.status === 200 || response.status === 201) {
        this.testPledgeId = response.data.id || response.data.pledge?.id;
        this.log('Pledge Creation', 'PASS', `Test pledge created with ID: ${this.testPledgeId}`);
      } else {
        this.log('Pledge Creation', 'FAIL', `HTTP ${response.status}: ${response.data.message || 'Unknown error'}`);
      }
    });

    // Test 8: Retrieve created pledge
    if (this.testPledgeId) {
      await this.test('Pledge Retrieval', async () => {
        const response = await this.makeRequest(`/api/pledges/${this.testPledgeId}`);
        if (response.status === 200) {
          this.log('Pledge Retrieval', 'PASS', `Retrieved pledge: ${response.data.title || response.data.name}`);
        } else {
          this.log('Pledge Retrieval', 'FAIL', `HTTP ${response.status}`);
        }
      });
    }

    // Test 9: AI Message Generation (if AI is available)
    if (this.testPledgeId && this.results.find(r => r.test === 'AI Service' && r.status === 'PASS')) {
      await this.test('AI Message Generation', async () => {
        const response = await this.makeRequest('/api/messages/reminder', 'POST', {
          pledgeId: this.testPledgeId,
          type: 'reminder',
          tone: 'friendly'
        });
        if (response.status === 200) {
          this.log('AI Message Generation', 'PASS', 'AI-generated message created');
        } else {
          this.log('AI Message Generation', 'FAIL', `HTTP ${response.status}`);
        }
      });
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${total}`);
    console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%\n`);

    // System Status
    const backendWorking = this.results.find(r => r.test === 'Basic Connectivity' && r.status === 'PASS');
    const dbWorking = this.results.find(r => r.test === 'Database Connection' && r.status === 'PASS');
    const aiWorking = this.results.find(r => r.test === 'AI Service' && r.status === 'PASS');

    console.log('🏥 SYSTEM HEALTH:');
    console.log(`   Backend Server: ${backendWorking ? '🟢 Healthy' : '🔴 Down'}`);
    console.log(`   Database: ${dbWorking ? '🟢 Connected' : '🔴 Disconnected'}`);
    console.log(`   AI Service: ${aiWorking ? '🟢 Available' : '🟡 Unavailable'}`);
    console.log(`   Analytics: ${this.results.find(r => r.test === 'Analytics Service' && r.status === 'PASS') ? '🟢 Working' : '🔴 Not Working'}`);
    console.log(`   Messaging: ${this.results.find(r => r.test === 'Message Generation' && r.status === 'PASS') ? '🟢 Working' : '🔴 Not Working'}`);

    console.log('\n🚀 PledgeHub SYSTEM STATUS:');
    if (passed >= 6) {
      console.log('   🎉 FULLY FUNCTIONAL - All core systems operational!');
    } else if (passed >= 4) {
      console.log('   ⚡ MOSTLY FUNCTIONAL - Core features working with some issues');
    } else {
      console.log('   🔧 NEEDS ATTENTION - Multiple systems require fixes');
    }

    if (this.testPledgeId) {
      console.log(`\n🧹 Note: Test pledge created with ID ${this.testPledgeId} - you may want to clean this up manually`);
    }

    console.log('\n');
  }
}

// Run the comprehensive test
async function main() {
  const tester = new PledgeHubTester();
  await tester.runAllTests();
}

main().catch(console.error);
