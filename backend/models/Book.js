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
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
}, { timestamps: true });

bookSchema.index({ title: 1 });
bookSchema.index({ authors: 1 });
bookSchema.index({ categories: 1 });

module.exports = mongoose.model('Book', bookSchema);
