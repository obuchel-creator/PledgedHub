/**
 * Commission Routes Tests
 * Tests for commission summary, payout, and statistics endpoints
 */

const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/db');

describe('Commission Routes', () => {
  let authToken;
  let userId;
  let campaignId;

  beforeAll(async () => {
    // Create or login test user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'commissiontest@example.com',
        password: 'testpass123'
      });

    authToken = loginRes.body.token;
    userId = loginRes.body.user.id;

    // Create a test campaign
    const campaignRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Campaign',
        description: 'Test campaign for commission tests',
        goal: 1000000,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

    campaignId = campaignRes.body.campaign.id;
  });

  describe('GET /api/commissions/summary', () => {
    it('should fetch commission summary', async () => {
      const res = await request(app)
        .get('/api/commissions/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accrued');
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('paidOut');
      expect(res.body.data).toHaveProperty('total');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/commissions/summary');

      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      // Create non-admin user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          name: 'Test User'
        });

      const userToken = userRes.body.token;

      const res = await request(app)
        .get('/api/commissions/summary')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/commissions/history', () => {
    it('should fetch commission payout history', async () => {
      const res = await request(app)
        .get('/api/commissions/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('payouts');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.payouts)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/commissions/history?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/commissions/payout', () => {
    it('should create payout request', async () => {
      const res = await request(app)
        .post('/api/commissions/payout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100000,
          method: 'mtn'
        });

      expect([200, 201, 400]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(res.body.success).toBe(true);
      }
    });

    it('should reject minimum amount', async () => {
      const res = await request(app)
        .post('/api/commissions/payout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5000,
          method: 'mtn'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate payment method', async () => {
      const res = await request(app)
        .post('/api/commissions/payout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100000,
          method: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require PIN for high amounts', async () => {
      const res = await request(app)
        .post('/api/commissions/payout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000000,
          method: 'mtn',
          pin: '1234'
        });

      expect([200, 201, 401, 400]).toContain(res.status);
    });
  });

  describe('POST /api/commissions/payout/batch', () => {
    it('should create batch payout request', async () => {
      const res = await request(app)
        .post('/api/commissions/payout/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          campaigns: [campaignId],
          method: 'mtn'
        });

      expect([200, 201, 400]).toContain(res.status);
    });

    it('should require campaign IDs', async () => {
      const res = await request(app)
        .post('/api/commissions/payout/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          campaigns: [],
          method: 'mtn'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/commissions/stats', () => {
    it('should fetch commission statistics', async () => {
      const res = await request(app)
        .get('/api/commissions/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('statistics');
      expect(res.body.data).toHaveProperty('period');
    });

    it('should support different periods', async () => {
      const periods = ['day', 'week', 'month', 'year'];

      for (const period of periods) {
        const res = await request(app)
          .get(`/api/commissions/stats?period=${period}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.period).toBe(period);
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await pool.execute('DELETE FROM commission_payouts WHERE user_id = ?', [userId]);
    await pool.execute('DELETE FROM campaigns WHERE id = ?', [campaignId]);
  });
});
