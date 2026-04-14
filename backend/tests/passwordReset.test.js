/**
 * Tests for POST /api/reset/send-reset-email
 *           POST /api/reset/reset-password/:token
 */

jest.mock('../utils/resetEmail', () => jest.fn().mockResolvedValue(undefined));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser } = require('./helpers/factories');
const User = require('../models/User');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

// POST /api/reset/send-reset-email
describe('POST /api/reset/send-reset-email', () => {
  it('returns 200 for a valid, verified email', async () => {
    await createVerifiedUser({ email: 'verified@example.com' });

    const res = await request(app)
      .post('/api/reset/send-reset-email')
      .send({ email: 'verified@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset email sent/i);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await request(app)
      .post('/api/reset/send-reset-email')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the email is not found in the database', async () => {
    const res = await request(app)
      .post('/api/reset/send-reset-email')
      .send({ email: 'ghost@example.com' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the user exists but is not verified', async () => {
    await User.create({
      firstName: 'Un', lastName: 'Verified',
      email: 'unverified@example.com',
      password: await bcrypt.hash('Password1!', 10),
      isVerified: false,
    });

    const res = await request(app)
      .post('/api/reset/send-reset-email')
      .send({ email: 'unverified@example.com' });

    expect(res.status).toBe(400);
  });
});

// POST /api/reset/reset-password/:token
describe('POST /api/reset/reset-password/:token', () => {
  let user, validToken;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    user = await createVerifiedUser({ email: 'reset@example.com' });
    validToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('returns 200 and updates the password with a valid token', async () => {
    const res = await request(app)
      .post(`/api/reset/reset-password/${validToken}`)
      .send({ newPassword: 'NewPass1!', confirmNewPassword: 'NewPass1!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed/i);

    // Verify the password hash was actually updated
    const updated = await User.findById(user._id);
    const match = await bcrypt.compare('NewPass1!', updated.password);
    expect(match).toBe(true);
  });

  it('returns 400 when new passwords do not match', async () => {
    const res = await request(app)
      .post(`/api/reset/reset-password/${validToken}`)
      .send({ newPassword: 'NewPass1!', confirmNewPassword: 'DifferentPass1!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/match/i);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post(`/api/reset/reset-password/${validToken}`)
      .send({ newPassword: 'Ab1!', confirmNewPassword: 'Ab1!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password does not meet complexity requirements', async () => {
    const res = await request(app)
      .post(`/api/reset/reset-password/${validToken}`)
      .send({ newPassword: 'alllowercase1', confirmNewPassword: 'alllowercase1' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid or tampered token', async () => {
    const res = await request(app)
      .post('/api/reset/reset-password/this.is.invalid')
      .send({ newPassword: 'NewPass1!', confirmNewPassword: 'NewPass1!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a required field missing', async () => {
    const res = await request(app)
      .post(`/api/reset/reset-password/${validToken}`)
      .send({ newPassword: 'NewPass1!' }); // confirmNewPassword missing

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});
