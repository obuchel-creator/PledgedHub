const { setupTestUser, teardownTestUser } = require('./testUtils');
let token;

beforeAll(async () => {
  const result = await setupTestUser();
  token = result.token;
});
// Mock the model before requiring the app so controllers use the mock
jest.mock('../models/pledgeModel', () => ({
  create: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
}));

const Pledge = require('../models/pledgeModel');
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Pledge controller - additional edge/error tests', () => {
  test('POST /pledges - rejects non-numeric amount', async () => {
    const res = await request(app)
      .post('/pledges')
      .send({ title: 'T', amount: 'not-a-number' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /pledges - rejects title with only whitespace', async () => {
    const res = await request(app)
      .post('/pledges')
      .send({ title: '   ' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /pledges - model throws -> 500 Server error', async () => {
    Pledge.create.mockRejectedValue(new Error('DB fail'));
    const res = await request(app)
      .post('/pledges')
      .send({ title: 'Valid', amount: 10 })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Server error');
  });

  test('PUT /pledges/:id - no valid update fields -> 400', async () => {
    const res = await request(app)
      .put('/pledges/5')
      .send({}) // empty body
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('PUT /pledges/:id - model throws -> 500', async () => {
    Pledge.update.mockRejectedValue(new Error('DB fail'));
    const res = await request(app)
      .put('/pledges/5')
      .send({ title: 'Updated' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('DELETE /pledges/:id - softDelete returns 0 -> 404', async () => {
    Pledge.softDelete.mockResolvedValue(0);
    const res = await request(app)
      .delete('/pledges/99')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /pledges/:id - not found -> 404', async () => {
    Pledge.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/pledges/999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /pledges/:id - found -> 200 and pledge returned', async () => {
    const row = { id: 11, title: 'Found', name: 'Found' };
    Pledge.findById.mockResolvedValue(row);
    const res = await request(app)
      .get('/pledges/11')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pledge');
    expect(res.body.pledge).toMatchObject(row);
  });
afterAll(async () => {
  await teardownTestUser();
  if (db && typeof db.close === 'function') {
    await db.close();
  }
});
});

afterAll(async () => {
  if (db && typeof db.close === 'function') {
    await db.close();
  }
});