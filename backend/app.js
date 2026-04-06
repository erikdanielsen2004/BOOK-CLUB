console.log("This file is running");

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
/*
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
*/
const authRouter = require('./routes/auth.js');
// const userBooksRouter = require('./routes/userBooks.js');
const groupMainRouter = require('./routes/groupMain.js');

const mongoURI = 'no peeking';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);
// app.use('/api/user-books', userBooksRouter);
app.use('/api/group-main', groupMainRouter);
/*
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/
// Set dynamic port for Digital Ocean
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;


// DO NOT USE THIS CODE

// const express = require('express');
// const mongoose = require('mongoose');
// const app = express();
// const path = require('path');

// const authRouter = require('./routes/auth.js');

// const mongoURI = 'no peeking';

// mongoose.connect(mongoURI)
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.error('MongoDB connection error:', err));

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// // API routes FIRST
// app.use('/api/auth', authRouter);

// // Serve React build (make sure this path is correct)
// app.use(express.static(path.join(__dirname, 'public')));

// // Catch-all: send React app for any non-API route
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Port
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// module.exports = app;
