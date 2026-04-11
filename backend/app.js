require('dotenv').config({ path: 'variables.env' });
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const authRouter = require('./routes/auth.js');
const groupMainRouter = require('./routes/groupMain.js');
const groupOwnerRouter = require('./routes/groupOwner.js');
// const groupVotingRouter = require('./routes/groupVoting.js');
const passwordResetRouter = require('./routes/passwordReset.js');
const searchRouter = require('./routes/search.js');
const reviewsRouter = require('./routes/bookReviews.js');
const userBooksRouter = require('./routes/userBooks.js');

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/group-main', groupMainRouter);
app.use('/api/group-owner', groupOwnerRouter);
// app.use('/api/group-voting', groupVotingRouter);
app.use('/api/reset', passwordResetRouter);
app.use('/api/search', searchRouter);
app.use('/api/book-reviews', reviewsRouter);
app.use('/api/user-books', userBooksRouter);

module.exports = app;
