/**
 * Tests for POST   /api/group-owner/add-to-list/:userId/:groupId
 *           DELETE /api/group-owner/remove-from-list/:userId/:groupId/:bookId
 *           POST   /api/group-owner/:userId/:groupId/publish-list
 *           POST   /api/group-owner/start-vote/:userId/:groupId
 */

const request = require('supertest');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser, createBook, createGroup } = require('./helpers/factories');
const Group = require('../models/Group');
const Book = require('../models/Book');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

/** Convenience: build a valid book body payload for the add-to-list endpoint */
function bookBody(overrides = {}) {
  return {
    googleBooksId: `gbid_${Date.now()}_${Math.random()}`,
    title: 'Candidate Book',
    authors: ['Some Author'],
    description: 'A description.',
    categories: ['Fantasy'],
    thumbnail: 'https://example.com/t.jpg',
    pageCount: 320,
    publishedDate: '2022-03-10',
    averageRating: 0,
    ratingsCount: 0,
    ...overrides,
  };
}

// POST /api/group-owner/add-to-list/:userId/:groupId
describe('POST /api/group-owner/add-to-list/:userId/:groupId', () => {
  it('adds a new book to bookCandidates and returns 200', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);
    const body = bookBody();

    const res = await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/added/i);
    expect(res.body.group.bookCandidates).toHaveLength(1);
  });

  it('creates the book document in the DB if it does not exist yet', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);
    const body = bookBody();

    await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(body);

    const book = await Book.findOne({ googleBooksId: body.googleBooksId });
    expect(book).not.toBeNull();
    expect(book.title).toBe('Candidate Book');
  });

  it('reuses an existing Book document', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);
    const existingBook = await createBook({ googleBooksId: 'existing-id' });

    await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(bookBody({ googleBooksId: 'existing-id' }));

    const count = await Book.countDocuments({ googleBooksId: 'existing-id' });
    expect(count).toBe(1);
  });

  it('returns 400 when the book is already on the list', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);
    const body = bookBody();

    await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(body);

    const res = await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already on list/i);
  });

  it('returns 400 when the list already has 10 books', async () => {
    const owner = await createVerifiedUser();
    // Pre-populate with 10 candidates
    const books = await Promise.all(Array.from({ length: 10 }, () => createBook()));
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(bookBody());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/limit/i);
  });

  it('returns 400 when googleBooksId is missing', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner);
    const { googleBooksId, ...noId } = bookBody();

    const res = await request(app)
      .post(`/api/group-owner/add-to-list/${owner._id}/${group._id}`)
      .send(noId);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/googleBooksId/i);
  });

  it('returns 403 when a non-owner tries to add a book', async () => {
    const owner = await createVerifiedUser();
    const other = await createVerifiedUser();
    const group = await createGroup(owner);

    const res = await request(app)
      .post(`/api/group-owner/add-to-list/${other._id}/${group._id}`)
      .send(bookBody());

    expect(res.status).toBe(403);
  });
});

// DELETE /api/group-owner/remove-from-list/:userId/:groupId/:bookId
describe('DELETE /api/group-owner/remove-from-list/:userId/:groupId/:bookId', () => {
  it('removes a book from the candidate list and returns 200', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const group = await createGroup(owner, { bookCandidates: [book._id] });

    const res = await request(app)
      .delete(`/api/group-owner/remove-from-list/${owner._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.group.bookCandidates).toHaveLength(0);
  });

  it('returns 400 when a vote session is active', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [book._id],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .delete(`/api/group-owner/remove-from-list/${owner._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/voting is active/i);
  });

  it('returns 403 when a non-owner tries to remove a book', async () => {
    const owner = await createVerifiedUser();
    const other = await createVerifiedUser();
    const book = await createBook();
    const group = await createGroup(owner, { bookCandidates: [book._id] });

    const res = await request(app)
      .delete(`/api/group-owner/remove-from-list/${other._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(403);
  });
});

// POST /api/group-owner/:userId/:groupId/publish-list
describe('POST /api/group-owner/:userId/:groupId/publish-list', () => {
  it('resets votes/session flags and returns 200 when list has ≥2 books', async () => {
    const owner = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, {
      bookCandidates: books.map((b) => b._id),
      votes: [{ user: owner._id, book: books[0]._id }],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .post(`/api/group-owner/${owner._id}/${group._id}/publish-list`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/published/i);
    expect(res.body.group.voteSessionActive).toBe(false);
    expect(res.body.group.votes).toHaveLength(0);
  });

  it('returns 400 when the list has fewer than 2 books', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const group = await createGroup(owner, { bookCandidates: [book._id] });

    const res = await request(app)
      .post(`/api/group-owner/${owner._id}/${group._id}/publish-list`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 2/i);
  });

  it('returns 403 for a non-owner', async () => {
    const owner = await createVerifiedUser();
    const other = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/${other._id}/${group._id}/publish-list`);

    expect(res.status).toBe(403);
  });
});

// POST /api/group-owner/start-vote/:userId/:groupId
describe('POST /api/group-owner/start-vote/:userId/:groupId', () => {
  it('starts a vote session with a valid duration and returns 200', async () => {
    const owner = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${owner._id}/${group._id}`)
      .send({ durationDays: 3 });

    expect(res.status).toBe(200);
    expect(res.body.group.voteSessionActive).toBe(true);
    expect(new Date(res.body.group.voteEndAt).getTime())
      .toBeGreaterThan(Date.now());
  });

  it('cancels any previous vote session when a new one starts', async () => {
    const owner = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, {
      bookCandidates: books.map((b) => b._id),
      votes: [{ user: owner._id, book: books[0]._id }],
      voteSessionActive: true,
    });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${owner._id}/${group._id}`)
      .send({ durationDays: 1 });

    expect(res.status).toBe(200);
    expect(res.body.group.votes).toHaveLength(0); // old votes cleared
    expect(res.body.group.voteSessionActive).toBe(true);
  });

  it('returns 400 when durationDays is less than 1', async () => {
    const owner = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${owner._id}/${group._id}`)
      .send({ durationDays: 0 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/1 to 7/i);
  });

  it('returns 400 when durationDays exceeds 7', async () => {
    const owner = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${owner._id}/${group._id}`)
      .send({ durationDays: 8 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when durationDays is not an integer', async () => {
    const owner = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${owner._id}/${group._id}`)
      .send({ durationDays: 2.5 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the group has fewer than 2 candidates', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const group = await createGroup(owner, { bookCandidates: [book._id] });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${owner._id}/${group._id}`)
      .send({ durationDays: 2 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 2/i);
  });

  it('returns 403 for a non-owner', async () => {
    const owner = await createVerifiedUser();
    const other = await createVerifiedUser();
    const books = await Promise.all([createBook(), createBook()]);
    const group = await createGroup(owner, { bookCandidates: books.map((b) => b._id) });

    const res = await request(app)
      .post(`/api/group-owner/start-vote/${other._id}/${group._id}`)
      .send({ durationDays: 2 });

    expect(res.status).toBe(403);
  });
});
