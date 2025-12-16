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

afterEach(() => jest.clearAllMocks());

describe('Pledge controller (unit)', () => {
  test('POST /pledges - validation rejects missing title', async () => {
    const res = await request(app)
      .post('/pledges')
      .send({ description: 'no title' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /pledges - success returns 201 with created pledge', async () => {
    const created = { id: 10, name: 'Test', title: 'Test', description: 'desc', amount: '50.00' };
    Pledge.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/pledges')
      .send({ title: 'Test', description: 'desc', amount: 50 })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('pledge');
    expect(Pledge.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test' }));
  });

  test('PUT /pledges/:id - validation rejects invalid id', async () => {
    const res = await request(app)
      .put('/pledges/abc')
      .send({ title: 'Updated' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('PUT /pledges/:id - success returns affectedRows info', async () => {
    const updateResult = { affectedRows: 1, row: { id: 5, title: 'Updated' } };
    Pledge.update.mockResolvedValue(updateResult);

    const res = await request(app)
      .put('/pledges/5')
      .send({ title: 'Updated' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // controller returns affectedRows when model returns an object with affectedRows
    expect(res.body).toHaveProperty('affectedRows', updateResult.affectedRows);
    expect(Pledge.update).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Updated' }));
  });

  test('DELETE /pledges/:id - soft delete returns success true', async () => {
    Pledge.softDelete.mockResolvedValue(1);

    const res = await request(app)
      .delete('/pledges/7')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Pledge.softDelete).toHaveBeenCalledWith(7);
  });
afterAll(async () => {
  await teardownTestUser();
  if (db && typeof db.close === 'function') {
    await db.close();
  }
});
});

afterAll(async () => {
  // close DB pool so Jest can exit cleanly (server requires config/db)
  if (db && typeof db.close === 'function') {
    await db.close();
  }
});