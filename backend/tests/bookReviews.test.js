/**
 * Tests for GET    /api/book-reviews/search-books
 *           GET    /api/book-reviews/user-hasread/:userId
 *           GET    /api/book-reviews/view/:bookId
 *           POST   /api/book-reviews/create/:bookId/:userId
 *           DELETE /api/book-reviews/delete/:userId/:reviewId
 */

const request = require('supertest');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser, createBook, createReview } = require('./helpers/factories');
const User = require('../models/User');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

// GET /api/book-reviews/search-books
describe('GET /api/book-reviews/search-books', () => {
  it('returns 200 and only books that have at least one review', async () => {
    const user = await createVerifiedUser();
    const bookA = await createBook({ title: 'Reviewed Book' });
    const _bookB = await createBook({ title: 'No Reviews Book' });

    // Add bookA to hasRead and create a review
    user.hasRead.push(bookA._id);
    await user.save();
    await createReview(user, bookA);

    const res = await request(app).get('/api/book-reviews/search-books');

    expect(res.status).toBe(200);
    expect(res.body.books.some((b) => b.title === 'Reviewed Book')).toBe(true);
    expect(res.body.books.some((b) => b.title === 'No Reviews Book')).toBe(false);
  });

  it('filters results by the q query parameter', async () => {
    const user = await createVerifiedUser();
    const bookA = await createBook({ title: 'Alpha Novel' });
    const bookB = await createBook({ title: 'Beta Story' });
    user.hasRead.push(bookA._id, bookB._id);
    await user.save();
    await createReview(user, bookA, { rating: 3 });
    await createReview(user, bookB, { rating: 4 });

    const res = await request(app).get('/api/book-reviews/search-books').query({ q: 'alpha' });

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe('Alpha Novel');
  });

  it('returns an empty array when no reviewed books match the query', async () => {
    const res = await request(app).get('/api/book-reviews/search-books').query({ q: 'zzznomatch' });
    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(0);
  });
});

// GET /api/book-reviews/user-hasread/:userId
describe('GET /api/book-reviews/user-hasread/:userId', () => {
  it('returns books in hasRead that have not been reviewed yet', async () => {
    const user = await createVerifiedUser();
    const bookA = await createBook({ title: 'Unreviewed' });
    const bookB = await createBook({ title: 'Already Reviewed' });

    user.hasRead.push(bookA._id, bookB._id);
    await user.save();
    await createReview(user, bookB); // only bookB reviewed

    const res = await request(app).get(`/api/book-reviews/user-hasread/${user._id}`);

    expect(res.status).toBe(200);
    expect(res.body.books.some((b) => b.title === 'Unreviewed')).toBe(true);
    expect(res.body.books.some((b) => b.title === 'Already Reviewed')).toBe(false);
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app).get('/api/book-reviews/user-hasread/64a1b2c3d4e5f6a7b8c9d0e1');
    expect(res.status).toBe(404);
  });

  it('filters by q query parameter', async () => {
    const user = await createVerifiedUser();
    const bookA = await createBook({ title: 'Matching Title' });
    const bookB = await createBook({ title: 'Other Title' });
    user.hasRead.push(bookA._id, bookB._id);
    await user.save();

    const res = await request(app)
      .get(`/api/book-reviews/user-hasread/${user._id}`)
      .query({ q: 'matching' });

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe('Matching Title');
  });
});

// GET /api/book-reviews/view/:bookId
describe('GET /api/book-reviews/view/:bookId', () => {
  it('returns 200 with book details, reviews, and pagination info', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();
    await createReview(user, book, { rating: 5, reviewText: 'Amazing!' });

    const res = await request(app).get(`/api/book-reviews/view/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.book._id.toString()).toBe(book._id.toString());
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviewCount).toBe(1);
    expect(res.body.averageRating).toBeCloseTo(5);
    expect(res.body.totalPages).toBe(1);
  });

  it('returns 404 for a non-existent book', async () => {
    const res = await request(app).get('/api/book-reviews/view/64a1b2c3d4e5f6a7b8c9d0e1');
    expect(res.status).toBe(404);
  });

  it('paginates reviews correctly', async () => {
    const user = await createVerifiedUser();
    const user2 = await createVerifiedUser();
    const user3 = await createVerifiedUser();
    const book = await createBook();

    for (const u of [user, user2, user3]) {
      u.hasRead.push(book._id);
      await u.save();
    }
    await createReview(user, book, { rating: 3 });
    await createReview(user2, book, { rating: 4 });
    await createReview(user3, book, { rating: 5 });

    const page1 = await request(app)
      .get(`/api/book-reviews/view/${book._id}`)
      .query({ page: 1, limit: 2 });

    expect(page1.status).toBe(200);
    expect(page1.body.reviews).toHaveLength(2);
    expect(page1.body.totalPages).toBe(2);
  });
});

// POST /api/book-reviews/create/:bookId/:userId
describe('POST /api/book-reviews/create/:bookId/:userId', () => {
  it('creates a review for a book in hasRead and returns 201', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 4, reviewText: 'Very good read.' });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(4);
    expect(res.body.review.reviewText).toBe('Very good read.');
  });

  it('updates book averageRating and ratingsCount after review creation', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();

    await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 3.5, reviewText: '' });

    const Book = require('../models/Book');
    const updated = await Book.findById(book._id);
    expect(updated.averageRating).toBeCloseTo(3.5);
    expect(updated.ratingsCount).toBe(1);
  });

  it('returns 400 for a rating below 0.5', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a rating above 5', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 5.5 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a rating that is not a 0.5 increment', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 3.3 });

    expect(res.status).toBe(400);
  });

  it('returns 403 when the book is not in the user\'s hasRead list', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 4 });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Has Read list/i);
  });

  it('returns 400 when the user tries to review the same book twice', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();
    await createReview(user, book);

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${user._id}`)
      .send({ rating: 3 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });

  it('returns 401 when the user email is not verified', async () => {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const unverified = await User.create({
      firstName: 'Un', lastName: 'Verified',
      email: 'unver@example.com',
      password: await bcrypt.hash('Password1!', 10),
      isVerified: false,
    });
    const book = await createBook();
    unverified.hasRead.push(book._id);
    await unverified.save();

    const res = await request(app)
      .post(`/api/book-reviews/create/${book._id}/${unverified._id}`)
      .send({ rating: 4 });

    expect(res.status).toBe(401);
  });
});

// DELETE /api/book-reviews/delete/:userId/:reviewId
describe('DELETE /api/book-reviews/delete/:userId/:reviewId', () => {
  it('deletes a review and returns 200', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();
    const review = await createReview(user, book);

    const res = await request(app)
      .delete(`/api/book-reviews/delete/${user._id}/${review._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('updates book averageRating and ratingsCount after deletion', async () => {
    const user = await createVerifiedUser();
    const book = await createBook();
    user.hasRead.push(book._id);
    await user.save();
    const review = await createReview(user, book, { rating: 5 });

    await request(app).delete(`/api/book-reviews/delete/${user._id}/${review._id}`);

    const Book = require('../models/Book');
    const updated = await Book.findById(book._id);
    expect(updated.ratingsCount).toBe(0);
    expect(updated.averageRating).toBe(0);
  });

  it('returns 404 when the review does not exist', async () => {
    const user = await createVerifiedUser();
    const res = await request(app)
      .delete(`/api/book-reviews/delete/${user._id}/64a1b2c3d4e5f6a7b8c9d0e1`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when the review belongs to a different user', async () => {
    const owner = await createVerifiedUser();
    const other = await createVerifiedUser();
    const book = await createBook();
    owner.hasRead.push(book._id);
    await owner.save();
    const review = await createReview(owner, book);

    const res = await request(app)
      .delete(`/api/book-reviews/delete/${other._id}/${review._id}`);

    expect(res.status).toBe(404); // review.user !== other._id → not found
  });
});
