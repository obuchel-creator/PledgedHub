
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

const { setupTestUser, teardownTestUser } = require('./testUtils');
let token;

beforeAll(async () => {
  const result = await setupTestUser();
  token = result.token;
});

test('GET /pledges returns 200', async () => {
  const res = await request(app)
    .get('/pledges')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('pledges');
});


afterAll(async () => {
  await teardownTestUser();
  if (db && typeof db.close === 'function') {
    await db.close();
  }
});