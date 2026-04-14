/**
 * search.test.js
 * Tests for GET /api/search/books
 *
 * node-fetch is mocked so tests never hit the real Google Books API.
 * No database connection is needed — the search route does not touch MongoDB.
 */

jest.mock('node-fetch');

const request = require('supertest');
const fetch = require('node-fetch');
const app = require('./helpers/testApp');

// No db.connect/disconnect here — search has no DB dependency.
// jest.clearAllMocks() between tests keeps fetch mock calls isolated.
afterEach(() => jest.clearAllMocks());

/** Helper: build a fake Google Books API item */
function makeFakeItem(id, title, authors = ['Author A'], categories = ['Fiction']) {
  return {
    id,
    volumeInfo: {
      title,
      authors,
      description: 'A fake description',
      categories,
      imageLinks: { thumbnail: `https://example.com/${id}.jpg` },
      pageCount: 250,
      publishedDate: '2021-06-01',
      averageRating: 4,
      ratingsCount: 100,
    },
  };
}

/** Helper: configure fetch mock to return a successful Google Books response */
function mockFetchSuccess(items = [], totalItems = items.length) {
  fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({ totalItems, items }),
  });
}

/** Helper: configure fetch mock to return a Google API error */
function mockFetchError(status = 400, message = 'Bad Request') {
  fetch.mockResolvedValue({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ error: { message } }),
  });
}

// ---------------------------------------------------------------------------
describe('GET /api/search/books', () => {
  it('returns 400 when neither q nor category is provided', async () => {
    const res = await request(app).get('/api/search/books');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/query or category is required/i);
  });

  it('returns 200 and normalised books for a valid query', async () => {
    const items = [makeFakeItem('abc123', 'Dune'), makeFakeItem('def456', 'Foundation')];
    mockFetchSuccess(items, 2);

    const res = await request(app).get('/api/search/books').query({ q: 'science fiction' });

    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(2);
    expect(res.body.books).toHaveLength(2);
    expect(res.body.books[0]).toMatchObject({
      googleBooksId: 'abc123',
      title: 'Dune',
    });
  });

  it('returns 200 with an empty books array when Google returns no items', async () => {
    mockFetchSuccess([], 0);

    const res = await request(app).get('/api/search/books').query({ q: 'xyznothing' });

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(0);
    expect(res.body.totalItems).toBe(0);
  });

  it('supports filtering by category alone', async () => {
    mockFetchSuccess([makeFakeItem('g1', 'A Sci-Fi Book', ['Author'], ['Science Fiction'])], 1);

    const res = await request(app).get('/api/search/books').query({ category: 'Science Fiction' });

    expect(res.status).toBe(200);
    expect(res.body.books[0].categories).toContain('Science Fiction');
    // The URL sent to Google should include a subject: filter
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('subject%3AScience+Fiction'));
  });

  it('combines q and category in the Google Books query', async () => {
    mockFetchSuccess([makeFakeItem('h1', 'Cosmos')], 1);

    await request(app).get('/api/search/books').query({ q: 'cosmos', category: 'Science' });

    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('cosmos');
    expect(calledUrl).toContain('subject%3AScience');
  });

  it('caps maxResults at 40', async () => {
    mockFetchSuccess([], 0);

    await request(app).get('/api/search/books').query({ q: 'test', maxResults: 999 });

    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('maxResults=40');
  });

  it('returns 500 when fetch throws a network error', async () => {
    fetch.mockRejectedValue(new Error('Network failure'));

    const res = await request(app).get('/api/search/books').query({ q: 'test' });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/server error/i);
  });

  it('forwards non-ok Google API responses with the correct status', async () => {
    mockFetchError(403, 'Daily Limit Exceeded');

    const res = await request(app).get('/api/search/books').query({ q: 'test' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Daily Limit Exceeded/i);
  });

  it('normalises missing volumeInfo fields to sensible defaults', async () => {
    mockFetchSuccess([{ id: 'min1', volumeInfo: {} }], 1);

    const res = await request(app).get('/api/search/books').query({ q: 'minimal' });

    expect(res.status).toBe(200);
    const book = res.body.books[0];
    expect(book.title).toBe('Untitled');
    expect(book.authors).toEqual([]);
    expect(book.pageCount).toBe(0);
    expect(book.averageRating).toBe(0);
  });
});