/**
 * Mirrors app.js exactly, but does NOT call mongoose.connect().
 * Tests connect to MongoMemoryReplSet via db.js,
 * so we need the app to stay out of the way.
 *
 * jest.mock() calls in each test file are above all require()s,
 * so by the time this file is loaded any needed mocks (e.g. verifyEmail,
 * resetEmail, node-fetch) are already in place.
 */

const express = require('express');

const authRouter = require('../../routes/auth.js');
const groupMainRouter = require('../../routes/groupMain.js');
const groupOwnerRouter = require('../../routes/groupOwner.js');
const groupVotingRouter = require('../../routes/groupVoting.js');
const passwordResetRouter = require('../../routes/passwordReset.js');
const searchRouter = require('../../routes/search.js');
const reviewsRouter = require('../../routes/bookReviews.js');
const userBooksRouter = require('../../routes/userBooks.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/group-main', groupMainRouter);
app.use('/api/group-owner', groupOwnerRouter);
app.use('/api/group-voting', groupVotingRouter);
app.use('/api/reset', passwordResetRouter);
app.use('/api/search', searchRouter);
app.use('/api/book-reviews', reviewsRouter);
app.use('/api/user-books', userBooksRouter);

module.exports = app;
