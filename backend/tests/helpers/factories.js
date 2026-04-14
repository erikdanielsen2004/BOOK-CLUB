/**
 * Lightweight factory functions for seeding test data.
 *
 * Each factory accepts an optional `overrides` object so individual tests
 * can customise just the fields they care about.
 */

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Book = require('../../models/Book');
const Group = require('../../models/Group');
const Review = require('../../models/Review');

let seq = 0;
function uid() { return `${++seq}_${Date.now()}`; }

// User
// Creates an unverified user
async function createUser(overrides = {}) {
  const defaults = {
    firstName: 'Test',
    lastName: 'User',
    email: `user_${uid()}@example.com`,
    password: await bcrypt.hash('Password1!', 10),
    isVerified: false,
  };
  return User.create({ ...defaults, ...overrides });
}

// Creates a verified user (most tests need this).
async function createVerifiedUser(overrides = {}) {
  return createUser({ isVerified: true, ...overrides });
}

// Book
async function createBook(overrides = {}) {
  const defaults = {
    googleBooksId: `gbid_${uid()}`,
    title: 'Test Book',
    authors: ['Author One'],
    description: 'A gripping tale.',
    categories: ['Fiction'],
    thumbnail: 'https://example.com/thumb.jpg',
    pageCount: 300,
    publishedDate: '2020-01-01',
    averageRating: 0,
    ratingsCount: 0,
  };
  return Book.create({ ...defaults, ...overrides });
}

// Group
async function createGroup(owner, overrides = {}) {
  const defaults = {
    name: `Test Group ${uid()}`,
    description: 'A test group',
    owner: owner._id,
    members: [owner._id],
    bookCandidates: [],
    votes: [],
    voteSessionActive: false,
    voteStartAt: null,
    voteEndAt: null,
  };
  return Group.create({ ...defaults, ...overrides });
}

// Review
async function createReview(user, book, overrides = {}) {
  const defaults = {
    user: user._id,
    book: book._id,
    rating: 4,
    reviewText: 'Really enjoyed it.',
  };
  return Review.create({ ...defaults, ...overrides });
}

module.exports = { createUser, createVerifiedUser, createBook, createGroup, createReview };
