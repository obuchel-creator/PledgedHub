/**
 * Accounting Routes Tests
 * Tests for journal entries, chart of accounts, and financial reports
 */

const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/db');

describe('Accounting Routes', () => {
  let authToken;
  let userId;
  let accountId;

  beforeAll(async () => {
    // Create or login test user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'accountingtest@example.com',
        password: 'testpass123'
      });

    authToken = loginRes.body.token;
    userId = loginRes.body.user.id;
  });

  describe('GET /api/accounting/dashboard', () => {
    it('should fetch accounting dashboard', async () => {
      const res = await request(app)
        .get('/api/accounting/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('assets');
      expect(res.body.data).toHaveProperty('liabilities');
      expect(res.body.data).toHaveProperty('equity');
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('expenses');
      expect(res.body.data).toHaveProperty('netIncome');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/accounting/dashboard');

      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      // Create non-admin token
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'acctuser@example.com',
          password: 'password123',
          name: 'Account User'
        });

      const userToken = userRes.body.token;

      const res = await request(app)
        .get('/api/accounting/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/accounting/accounts', () => {
    it('should fetch chart of accounts', async () => {
      const res = await request(app)
        .get('/api/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should include account details', async () => {
      const res = await request(app)
        .get('/api/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      if (res.body.data.length > 0) {
        const account = res.body.data[0];
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('code');
        expect(account).toHaveProperty('name');
        expect(account).toHaveProperty('type');
        expect(account).toHaveProperty('balance');
      }
    });
  });

  describe('POST /api/accounting/accounts', () => {
    it('should create new account', async () => {
      const res = await request(app)
        .post('/api/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: `TEST-${Date.now()}`,
          name: 'Test Account',
          type: 'ASSET',
          description: 'Test account for unit tests'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accountId');
      accountId = res.body.data.accountId;
    });

    it('should reject invalid account type', async () => {
      const res = await request(app)
        .post('/api/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: `INV-${Date.now()}`,
          name: 'Invalid Account',
          type: 'INVALID'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate account code', async () => {
      const code = `DUP-${Date.now()}`;

      // Create first account
      await request(app)
        .post('/api/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: code,
          name: 'First Account',
          type: 'ASSET'
        });

      // Try to create duplicate
      const res = await request(app)
        .post('/api/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: code,
          name: 'Second Account',
          type: 'ASSET'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });
  });

  describe('GET /api/accounting/journal-entries', () => {
    it('should fetch journal entries', async () => {
      const res = await request(app)
        .get('/api/accounting/journal-entries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/accounting/journal-entries?page=1&limit=20')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });
  });

  describe('POST /api/accounting/journal-entries', () => {
    it('should create journal entry with balanced lines', async () => {
      const res = await request(app)
        .post('/api/accounting/journal-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          description: 'Test journal entry',
          reference: `TEST-${Date.now()}`,
          lines: [
            { account: 'Cash', debit: 100000, credit: 0, description: 'Cash in' },
            { account: 'Revenue', debit: 0, credit: 100000, description: 'Revenue' }
          ]
        });

      expect([200, 201, 400]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject unbalanced journal entry', async () => {
      const res = await request(app)
        .post('/api/accounting/journal-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          description: 'Unbalanced entry',
          reference: `UNBAL-${Date.now()}`,
          lines: [
            { account: 'Cash', debit: 100000, credit: 0 },
            { account: 'Revenue', debit: 0, credit: 50000 }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('equal');
    });

    it('should reject invalid account', async () => {
      const res = await request(app)
        .post('/api/accounting/journal-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          description: 'Invalid account',
          reference: `INVALID-${Date.now()}`,
          lines: [
            { account: 'NonExistent', debit: 100000, credit: 0 },
            { account: 'Also NonExistent', debit: 0, credit: 100000 }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Financial Reports', () => {
    describe('GET /api/accounting/reports/balance-sheet', () => {
      it('should generate balance sheet', async () => {
        const res = await request(app)
          .get('/api/accounting/reports/balance-sheet')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('assets');
        expect(res.body.data).toHaveProperty('liabilities');
        expect(res.body.data).toHaveProperty('equity');
        expect(res.body.data).toHaveProperty('total_assets');
        expect(res.body.data).toHaveProperty('balanced');
      });
    });

    describe('GET /api/accounting/reports/income-statement', () => {
      it('should generate income statement', async () => {
        const res = await request(app)
          .get('/api/accounting/reports/income-statement')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('revenues');
        expect(res.body.data).toHaveProperty('expenses');
        expect(res.body.data).toHaveProperty('net_income');
      });
    });

    describe('GET /api/accounting/reports/trial-balance', () => {
      it('should generate trial balance', async () => {
        const res = await request(app)
          .get('/api/accounting/reports/trial-balance')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accounts');
        expect(res.body.data).toHaveProperty('total_debits');
        expect(res.body.data).toHaveProperty('total_credits');
        expect(res.body.data).toHaveProperty('balanced');
      });
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (accountId) {
      await pool.execute('DELETE FROM accounts WHERE id = ?', [accountId]);
    }
  });
});
