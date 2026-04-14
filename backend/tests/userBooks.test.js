/**
 * Tests for GET    /api/user-books/:userId
 *           POST   /api/user-books/:userId/:list
 *           PUT    /api/user-books/:userId/move
 *           DELETE /api/user-books/:userId/:list/:bookId
 */

const request = require('supertest');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser, createBook } = require('./helpers/factories');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

// Reusable valid book payload (matches normalizeBookPayload expectations)
const bookPayload = () => ({
  googleBooksId: `gbid_${Date.now()}_${Math.random()}`,
  title: 'A Great Novel',
  authors: ['Jane Author'],
  description: 'Wonderful.',
  categories: ['Drama'],
  thumbnail: 'https://example.com/t.jpg',
  pageCount: 400,
  publishedDate: '2019-05-01',
});

// GET /api/user-books/:userId
describe('GET /api/user-books/:userId', () => {
  it('returns 200 and the three book lists for a valid user', async () => {
    const user = await createVerifiedUser();
    const res = await request(app).get(`/api/user-books/${user._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasRead');
    expect(res.body).toHaveProperty('reading');
    expect(res.body).toHaveProperty('wantsToRead');
  });

  it('returns 404 for a non-existent user', async () => {
    const fakeId = '64a1b2c3d4e5f6a7b8c9d0e1';
    const res = await request(app).get(`/api/user-books/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('populates books within the lists', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    // Manually push book onto user's reading list
    user.reading.push(book._id);
    await user.save();

    const res = await request(app).get(`/api/user-books/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.reading).toHaveLength(1);
    expect(res.body.reading[0].title).toBe(book.title);
  });
});

// POST /api/user-books/:userId/:list
describe('POST /api/user-books/:userId/:list', () => {
  it('adds a new book to hasRead and returns 200', async () => {
    const user = await createVerifiedUser();
    const payload = bookPayload();

    const res = await request(app)
      .post(`/api/user-books/${user._id}/hasRead`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/hasRead/i);
    expect(res.body.book.googleBooksId).toBe(payload.googleBooksId);
  });

  it('adds a book to wantsToRead', async () => {
    const user = await createVerifiedUser();
    const res = await request(app)
      .post(`/api/user-books/${user._id}/wantsToRead`)
      .send(bookPayload());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/wantsToRead/i);
  });

  it('moves the book out of other lists when added to a new one', async () => {
    const user = await createVerifiedUser();
    const payload = bookPayload();

    // First, add to reading
    await request(app).post(`/api/user-books/${user._id}/reading`).send(payload);
    // Then move to hasRead via the same endpoint
    await request(app).post(`/api/user-books/${user._id}/hasRead`).send(payload);

    const res = await request(app).get(`/api/user-books/${user._id}`);
    expect(res.body.reading).toHaveLength(0);
    expect(res.body.hasRead).toHaveLength(1);
  });

  it('returns 400 for an invalid list name', async () => {
    const user = await createVerifiedUser();
    const res = await request(app)
      .post(`/api/user-books/${user._id}/invalidList`)
      .send(bookPayload());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid list/i);
  });

  it('returns 400 when googleBooksId is missing', async () => {
    const user = await createVerifiedUser();
    const { googleBooksId, ...noId } = bookPayload();

    const res = await request(app)
      .post(`/api/user-books/${user._id}/reading`)
      .send(noId);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/googleBooksId/i);
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .post('/api/user-books/64a1b2c3d4e5f6a7b8c9d0e1/reading')
      .send(bookPayload());

    expect(res.status).toBe(404);
  });

  it('reuses an existing Book document if googleBooksId already exists', async () => {
    const user = await createVerifiedUser();
    const payload = bookPayload();

    await request(app).post(`/api/user-books/${user._id}/reading`).send(payload);
    await request(app).post(`/api/user-books/${user._id}/hasRead`).send(payload);

    const Book = require('../models/Book');
    const count = await Book.countDocuments({ googleBooksId: payload.googleBooksId });
    expect(count).toBe(1); // no duplicate Book documents
  });
});

// PUT /api/user-books/:userId/move
describe('PUT /api/user-books/:userId/move', () => {
  it('moves a book to a different list', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.reading.push(book._id);
    await user.save();

    const res = await request(app)
      .put(`/api/user-books/${user._id}/move`)
      .send({ to: 'hasRead', bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/moved/i);

    const listRes = await request(app).get(`/api/user-books/${user._id}`);
    expect(listRes.body.reading).toHaveLength(0);
    expect(listRes.body.hasRead).toHaveLength(1);
  });

  it('returns 400 for an invalid destination list', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();

    const res = await request(app)
      .put(`/api/user-books/${user._id}/move`)
      .send({ to: 'badList', bookId: book._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .put('/api/user-books/64a1b2c3d4e5f6a7b8c9d0e1/move')
      .send({ to: 'hasRead', bookId: '64a1b2c3d4e5f6a7b8c9d0e2' });

    expect(res.status).toBe(404);
  });
});

// DELETE /api/user-books/:userId/:list/:bookId
describe('DELETE /api/user-books/:userId/:list/:bookId', () => {
  it('removes a book from the list and returns 200', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.wantsToRead.push(book._id);
    await user.save();

    const res = await request(app)
      .delete(`/api/user-books/${user._id}/wantsToRead/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);

    const listRes = await request(app).get(`/api/user-books/${user._id}`);
    expect(listRes.body.wantsToRead).toHaveLength(0);
  });

  it('returns 400 for an invalid list name', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();

    const res = await request(app)
      .delete(`/api/user-books/${user._id}/badList/${book._id}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .delete('/api/user-books/64a1b2c3d4e5f6a7b8c9d0e1/reading/64a1b2c3d4e5f6a7b8c9d0e2');

    expect(res.status).toBe(404);
  });

  it('is idempotent: deleting a book not in the list still returns 200', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();

    const res = await request(app)
      .delete(`/api/user-books/${user._id}/reading/${book._id}`);

    expect(res.status).toBe(200);
  });
});
