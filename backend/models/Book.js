const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    googleBooksId: { type: String, unique: true },

    title: String,
    authors: [String],
    description: String,
    categories: [String],
    thumbnail: String,
    pageCount: Number,
    publishedDate: String,
    averageRating: Number,
    ratingsCount: Number
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);