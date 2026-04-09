require('dotenv').config({ path: 'variables.env' });
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const authRouter = require('./routes/auth.js');
const userBooksRouter = require('./routes/userBooks.js');
const groupMainRouter = require('./routes/groupMain.js');
const passwordResetRouter = require('./routes/passwordReset.js');
const searchRouter = require('./routes/search.js');

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/user-books', userBooksRouter);
app.use('/api/group-main', groupMainRouter);
app.use('/api/reset', passwordResetRouter);
app.use('/api/search', searchRouter);

module.exports = app;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
