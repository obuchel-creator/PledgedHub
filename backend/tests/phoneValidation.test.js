/**
 * Phone Number Validation Tests for Pledge Creation
 * Tests both strict and flexible phone validation modes
 */

const request = require('supertest');
const express = require('express');
const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');

// Mock dependencies before requiring the controller
jest.mock('../config/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

jest.mock('../models/Pledge', () => ({
  create: jest.fn()
}));

jest.mock('../services/pledgeVerificationService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../services/campaignService', () => ({
  updateCampaignAmount: jest.fn().mockResolvedValue({ success: true })
}));

const pledgeController = require('../controllers/pledgeController');
const Pledge = require('../models/Pledge');

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = req.headers.authorization.replace('Bearer ', '');
  req.user = jwt.decode(token);
  req.tenant = { id: req.user.tenant_id };
  next();
};

app.post('/pledges', mockAuthMiddleware, pledgeController.createPledge);

describe('Phone Number Validation for Pledge Creation', () => {
  let testToken;
  const testUser = {
    id: 123,
    name: 'John Doe',
    phone: '+256700123456',
    phone_number: '+256700123456',
    tenant_id: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create test JWT token
    testToken = jwt.sign(
      testUser,
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Mock Pledge.create to return success
    Pledge.create.mockResolvedValue({
      id: 1,
      donor_name: 'John Doe',
      donor_phone: '+256700123456',
      amount: 50000,
      status: 'pending'
    });
  });

  describe('Flexible Mode (ENABLE_STRICT_PHONE_VALIDATION=false)', () => {
    beforeEach(() => {
      process.env.ENABLE_STRICT_PHONE_VALIDATION = 'false';
    });

    test('Should allow pledge with matching phone number', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '+256700123456',  // Matches user's registered phone
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.pledge).toBeDefined();
    });

    test('Should allow pledge with different phone number (flexible mode)', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '+256750999888',  // Different from registered phone
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge with alternate phone',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.pledge).toBeDefined();
    });

    test('Should normalize phone numbers for comparison', async () => {
      // User's phone: +256700123456
      // Submitted: 256700123456 (without +, should still match)
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '256700123456',  // Same but without + prefix
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge with normalized phone',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Should handle phone with spaces and dashes', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '+256 700-123-456',  // With spaces and dashes
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge with formatted phone',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Strict Mode (ENABLE_STRICT_PHONE_VALIDATION=true)', () => {
    beforeEach(() => {
      process.env.ENABLE_STRICT_PHONE_VALIDATION = 'true';
    });

    test('Should allow pledge with matching phone number', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '+256700123456',  // Matches user's registered phone
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Should reject pledge with different phone number (strict mode)', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '+256750999888',  // Different from registered phone
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge with alternate phone',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Phone number must match your registered phone');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.registeredPhone).toBe('+256700123456');
      expect(response.body.details.submittedPhone).toBe('+256750999888');
    });

    test('Should allow phone with different formatting if numbers match', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '256 700 123 456',  // Same number, different format
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge with formatted phone',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.ENABLE_STRICT_PHONE_VALIDATION = 'false';
    });

    test('Should handle user without registered phone', async () => {
      // Create token for user without phone
      const userWithoutPhone = { ...testUser, phone: null, phone_number: null };
      const tokenWithoutPhone = jwt.sign(
        userWithoutPhone,
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${tokenWithoutPhone}`)
        .send({
          donor_name: 'John Doe',
          donor_phone: '+256700123456',
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      // Should succeed even without registered phone
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Should enforce name validation regardless of phone validation mode', async () => {
      const response = await request(app)
        .post('/pledges')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          donor_name: 'Jane Smith',  // Wrong name
          donor_phone: '+256700123456',
          donor_email: 'john@example.com',
          amount: 50000,
          purpose: 'Test pledge',
          collection_date: '2026-03-01',
          date: '2026-02-06'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Pledge name must match your registered name');
    });
  });

  afterAll(() => {
    // Clean up environment
    delete process.env.ENABLE_STRICT_PHONE_VALIDATION;
  });
});
