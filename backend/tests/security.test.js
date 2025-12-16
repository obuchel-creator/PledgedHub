/**
 * Security Routes Tests
 * Tests for PIN security, IP whitelist, and security status endpoints
 */

const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/db');

describe('Security Routes', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create or login test user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'securitytest@example.com',
        password: 'testpass123'
      });

    authToken = loginRes.body.token;
    userId = loginRes.body.user.id;
  });

  describe('POST /api/security/pin/update', () => {
    it('should update user PIN successfully', async () => {
      const res = await request(app)
        .post('/api/security/pin/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPin: '0000',
          newPin: '1234',
          confirmPin: '1234'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid PIN format', async () => {
      const res = await request(app)
        .post('/api/security/pin/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPin: '0000',
          newPin: 'abcd',
          confirmPin: 'abcd'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('digits');
    });

    it('should reject mismatched PIN confirmation', async () => {
      const res = await request(app)
        .post('/api/security/pin/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPin: '0000',
          newPin: '1234',
          confirmPin: '5678'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/security/pin/update')
        .send({
          currentPin: '0000',
          newPin: '1234',
          confirmPin: '1234'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/security/pin/threshold', () => {
    it('should update PIN threshold', async () => {
      const res = await request(app)
        .post('/api/security/pin/threshold')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ threshold: 1000000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.threshold).toBe(1000000);
    });

    it('should reject threshold below minimum', async () => {
      const res = await request(app)
        .post('/api/security/pin/threshold')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ threshold: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/security/whitelist/add', () => {
    it('should add IP to whitelist', async () => {
      const res = await request(app)
        .post('/api/security/whitelist/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ipAddress: '192.168.1.100',
          description: 'Office'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid IP format', async () => {
      const res = await request(app)
        .post('/api/security/whitelist/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ipAddress: 'invalid-ip'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate IP', async () => {
      const res = await request(app)
        .post('/api/security/whitelist/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ipAddress: '192.168.1.100'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already');
    });
  });

  describe('POST /api/security/whitelist/remove', () => {
    it('should remove IP from whitelist', async () => {
      const res = await request(app)
        .post('/api/security/whitelist/remove')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ipAddress: '192.168.1.100' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/security/settings', () => {
    it('should fetch security settings', async () => {
      const res = await request(app)
        .get('/api/security/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pin');
      expect(res.body.data).toHaveProperty('ipWhitelist');
      expect(res.body.data).toHaveProperty('twoFA');
    });
  });

  describe('GET /api/security/status', () => {
    it('should fetch security status', async () => {
      const res = await request(app)
        .get('/api/security/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('securityScore');
      expect(res.body.data).toHaveProperty('pinEnabled');
      expect(res.body.data).toHaveProperty('ipWhitelistActive');
      expect(res.body.data).toHaveProperty('recommendations');
    });
  });

  describe('POST /api/security/pin/verify', () => {
    beforeEach(async () => {
      // Set a known PIN for testing
      await request(app)
        .post('/api/security/pin/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPin: '0000',
          newPin: '9999',
          confirmPin: '9999'
        });
    });

    it('should verify correct PIN', async () => {
      const res = await request(app)
        .post('/api/security/pin/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pin: '9999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      const res = await request(app)
        .post('/api/security/pin/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pin: '0000' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should track failed PIN attempts', async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/security/pin/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ pin: '0000' });
      }

      // Fourth attempt should be locked
      const res = await request(app)
        .post('/api/security/pin/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pin: '0000' });

      expect(res.status).toBe(423);
      expect(res.body.error).toContain('locked');
    });
  });

  afterAll(async () => {
    // Clean up
    await pool.execute('DELETE FROM security_settings WHERE user_id = ?', [userId]);
    await pool.execute('DELETE FROM ip_whitelist WHERE user_id = ?', [userId]);
  });
});
