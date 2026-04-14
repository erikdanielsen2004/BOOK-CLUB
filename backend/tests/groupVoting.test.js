/**
 * Tests for POST /api/group-voting/cast-vote/:userId/:groupId/:bookId
 *           POST /api/group-voting/vote-ended/:userId/:groupId
 */

const request = require('supertest');
const app = require('./helpers/testApp');
const db = require('./helpers/db');
const { createVerifiedUser, createBook, createGroup } = require('./helpers/factories');
const Group = require('../models/Group');

beforeAll(db.connect);
afterEach(db.clearCollections);
afterAll(db.disconnect);

/** Creates a group with an active vote session and the given book candidates. */
async function groupWithActiveVote(owner, books, extraMembers = []) {
  return createGroup(owner, {
    bookCandidates: books.map((b) => b._id),
    members: [owner._id, ...extraMembers.map((m) => m._id)],
    voteSessionActive: true,
    voteStartAt: new Date(),
    voteEndAt: new Date(Date.now() + 86_400_000), // +1 day
  });
}

// POST /api/group-voting/cast-vote/:userId/:groupId/:bookId
describe('POST /api/group-voting/cast-vote/:userId/:groupId/:bookId', () => {
  it('casts a vote for a valid candidate and returns 200', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const book2 = await createBook();
    const group = await groupWithActiveVote(owner, [book, book2]);

    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${owner._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/vote cast/i);
    expect(res.body.group.votes).toHaveLength(1);
    expect(res.body.group.votes[0].book).toBe(book._id.toString());
  });

  it('replaces a previous vote when the user votes again', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const book2 = await createBook();
    const group = await groupWithActiveVote(owner, [book, book2]);

    // First vote
    await request(app)
      .post(`/api/group-voting/cast-vote/${owner._id}/${group._id}/${book._id}`);

    // Change vote to book2
    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${owner._id}/${group._id}/${book2._id}`);

    expect(res.status).toBe(200);
    expect(res.body.group.votes).toHaveLength(1);
    expect(res.body.group.votes[0].book).toBe(book2._id.toString());
  });

  it('returns 400 when there is no active vote session', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const book2 = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [book._id, book2._id],
      voteSessionActive: false,
    });

    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${owner._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no active vote/i);
  });

  it('returns 400 when the vote session has expired', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const book2 = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [book._id, book2._id],
      voteSessionActive: true,
      voteStartAt: new Date(Date.now() - 200_000),
      voteEndAt: new Date(Date.now() - 100_000), // ended in the past
    });

    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${owner._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ended/i);
  });

  it('returns 403 when the user is not a group member', async () => {
    const owner = await createVerifiedUser();
    const outsider = await createVerifiedUser();
    const book = await createBook();
    const book2 = await createBook();
    const group = await groupWithActiveVote(owner, [book, book2]);

    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${outsider._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/member/i);
  });

  it('returns 404 when the book is not a valid candidate', async () => {
    const owner = await createVerifiedUser();
    const book = await createBook();
    const book2 = await createBook();
    const notCandidate = await createBook();
    const group = await groupWithActiveVote(owner, [book, book2]);

    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${owner._id}/${group._id}/${notCandidate._id}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not a valid candidate/i);
  });

  it('returns 401 when the user email is not verified', async () => {
    const owner = await createVerifiedUser();
    const unverified = await createVerifiedUser();
    await Group.prototype.constructor; // just importing to satisfy lint
    const book = await createBook();
    const book2 = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [book._id, book2._id],
      members: [owner._id, unverified._id],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86_400_000),
    });
    const User = require('../models/User');
    await User.findByIdAndUpdate(unverified._id, { isVerified: false });

    const res = await request(app)
      .post(`/api/group-voting/cast-vote/${unverified._id}/${group._id}/${book._id}`);

    expect(res.status).toBe(401);
  });
});

// POST /api/group-voting/vote-ended/:userId/:groupId
describe('POST /api/group-voting/vote-ended/:userId/:groupId', () => {
  it('ends the vote, picks the winning book, and returns 200', async () => {
    const owner = await createVerifiedUser();
    const member1 = await createVerifiedUser();
    const member2 = await createVerifiedUser();
    const bookA = await createBook({ title: 'Winner' });
    const bookB = await createBook({ title: 'Loser' });

    const group = await createGroup(owner, {
      bookCandidates: [bookA._id, bookB._id],
      members: [owner._id, member1._id, member2._id],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86_400_000),
      votes: [
        { user: owner._id, book: bookA._id }, // 2 votes for A
        { user: member1._id, book: bookA._id },
        { user: member2._id, book: bookB._id }, // 1 vote for B
      ],
    });

    const res = await request(app)
      .post(`/api/group-voting/vote-ended/${owner._id}/${group._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/ended/i);
    expect(res.body.group.voteSessionActive).toBe(false);
    expect(res.body.group.votes).toHaveLength(0);
    // currentBook should now be bookA
    expect(res.body.currentBook._id).toBe(bookA._id.toString());
  });

  it('ends vote with no votes cast — currentBook does not change', async () => {
    const owner = await createVerifiedUser();
    const bookA = await createBook();
    const bookB = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [bookA._id, bookB._id],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86_400_000),
      votes: [],
    });

    const res = await request(app)
      .post(`/api/group-voting/vote-ended/${owner._id}/${group._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/no votes/i);
    expect(res.body.group.voteSessionActive).toBe(false);
  });

  it('clears votes and deactivates the session after ending', async () => {
    const owner = await createVerifiedUser();
    const bookA = await createBook();
    const bookB = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [bookA._id, bookB._id],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86_400_000),
      votes: [{ user: owner._id, book: bookA._id }],
    });

    await request(app).post(`/api/group-voting/vote-ended/${owner._id}/${group._id}`);

    const updated = await Group.findById(group._id);
    expect(updated.voteSessionActive).toBe(false);
    expect(updated.votes).toHaveLength(0);
    expect(updated.voteStartAt).toBeNull();
    expect(updated.voteEndAt).toBeNull();
  });

  it('returns 400 when there is no active or prior vote to end', async () => {
    const owner = await createVerifiedUser();
    const group = await createGroup(owner, {
      voteSessionActive: false,
      voteEndAt: null,
    });

    const res = await request(app)
      .post(`/api/group-voting/vote-ended/${owner._id}/${group._id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no vote to end/i);
  });

  it('returns 403 when a non-owner tries to end the vote', async () => {
    const owner = await createVerifiedUser();
    const member = await createVerifiedUser();
    const bookA = await createBook();
    const bookB = await createBook();
    const group = await createGroup(owner, {
      bookCandidates: [bookA._id, bookB._id],
      members: [owner._id, member._id],
      voteSessionActive: true,
      voteStartAt: new Date(),
      voteEndAt: new Date(Date.now() + 86_400_000),
    });

    const res = await request(app)
      .post(`/api/group-voting/vote-ended/${member._id}/${group._id}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent group', async () => {
    const owner = await createVerifiedUser();
    const res = await request(app)
      .post(`/api/group-voting/vote-ended/${owner._id}/64a1b2c3d4e5f6a7b8c9d0e1`);

    expect(res.status).toBe(404);
  });
});
