require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');

const authRouter = require('./routes/auth.js');
// const userBooksRouter = require('./routes/userBooks.js');
const groupMainRouter = require('./routes/groupMain.js');

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
// app.use('/api/user-books', userBooksRouter);
app.use('/api/group-main', groupMainRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
