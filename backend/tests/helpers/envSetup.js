// Runs before any modules are loaded (setupFiles)
// Defines every process.env variable the app and routes rely on

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/test'; // overridden in db.js
process.env.JWT_SECRET = 'test-jwt-super-secret-key-1234';
process.env.JWT_AUTH_EXPIRES_IN = '1h';
process.env.JWT_EMAIL_VER_EXPIRES_IN = '1h';
process.env.JWT_RESET_PASS_EXPIRES_IN = '15m';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.GOOGLE_BOOKS_API_KEY = 'test-google-books-api-key';
process.env.RESEND_API_KEY = 'test-resend-api-key'; // prevents Resend constructor errors
