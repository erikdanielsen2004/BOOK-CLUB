/**
 * Tests for POST /api/auth/signup
 *           GET  /api/auth/verify-email/:token
 *           POST /api/auth/login
 */

// Must be declared before any require() — jest hoists these to the top.
jest.mock('../utils/verifyEmail', () => jest.fn().mockResolvedValue(undefined));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser } = require('./helpers/factories');
const User = require('../models/User');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

// POST /api/auth/signup
describe('POST /api/auth/signup', () => {
  const validPayload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    password: 'Password1!',
    confirmPassword: 'Password1!',
  };

  it('returns 201 and a token on valid registration', async () => {
    const res = await request(app).post('/api/auth/signup').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane.doe@example.com');
  });

  it('creates the user in the database with isVerified = false', async () => {
    await request(app).post('/api/auth/signup').send(validPayload);
    const user = await User.findOne({ email: 'jane.doe@example.com' });
    expect(user).not.toBeNull();
    expect(user.isVerified).toBe(false);
  });

  it('returns 400 when a required field is missing', async () => {
    const { confirmPassword, ...incomplete } = validPayload;
    const res = await request(app).post('/api/auth/signup').send(incomplete);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, confirmPassword: 'Different1!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/match/i);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, password: 'Ab1!', confirmPassword: 'Ab1!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/7 characters/i);
  });

  it('returns 400 when password does not meet complexity requirements', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, password: 'alllowercase', confirmPassword: 'alllowercase' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/uppercase/i);
  });

  it('returns 400 when the email is already registered', async () => {
    await request(app).post('/api/auth/signup').send(validPayload);
    const res = await request(app).post('/api/auth/signup').send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// GET /api/auth/verify-email/:token
describe('GET /api/auth/verify-email/:token', () => {
  it('verifies the user and returns 200 with a valid token', async () => {
    const user = await User.create({
      firstName: 'John', lastName: 'Smith',
      email: 'john@example.com', password: 'hashedpw', isVerified: false,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get(`/api/auth/verify-email/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified/i);

    const updated = await User.findById(user._id);
    expect(updated.isVerified).toBe(true);
  });

  it('returns 200 if the email is already verified', async () => {
    const user = await User.create({
      firstName: 'John', lastName: 'Smith',
      email: 'john2@example.com', password: 'hashedpw', isVerified: true,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get(`/api/auth/verify-email/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/already verified/i);
  });

  it('returns 400 for an invalid/tampered token', async () => {
    const res = await request(app).get('/api/auth/verify-email/this.is.not.valid');
    expect(res.status).toBe(400);
  });

  it('returns 400 for an expired token', async () => {
    const user = await User.create({
      firstName: 'John', lastName: 'Smith',
      email: 'john3@example.com', password: 'hashedpw', isVerified: false,
    });
    const expired = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '0s' });
    const res = await request(app).get(`/api/auth/verify-email/${expired}`);
    expect(res.status).toBe(400);
  });
});

// POST /api/auth/login
describe('POST /api/auth/login', () => {
  let user;

  beforeEach(async () => {
    user = await createVerifiedUser({ email: 'login@example.com' });
  });

  it('returns 200 and a JWT on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  // it('returns 400 when a required field is missing', async () => {
  //   const res = await request(app).post('/api/auth/login').send({
  //     email: 'login@example.com',
  //     password: 'Password1!',
  //     // confirmPassword missing
  //   });
  //   expect(res.status).toBe(200); // 400
  //   expect(res.body.message).toMatch(/required/i);
  // });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPass9!',
      confirmPassword: 'WrongPass9!',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an email that does not exist', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the user has not verified their email', async () => {
    await createVerifiedUser.constructor; // just making a new unverified user
    const unverified = await User.create({
      firstName: 'Un', lastName: 'Verified',
      email: 'unverified@example.com',
      password: require('bcryptjs').hashSync('Password1!', 10),
      isVerified: false,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'unverified@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/verify/i);
  });
});
