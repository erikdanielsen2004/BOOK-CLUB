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
    ratingsCount: Number,
    reviews: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Review'
        }
    ]
}, { timestamps: true });

bookSchema.index({ title: 1 });
bookSchema.index({ authors: 1 });
bookSchema.index({ categories: 1 });

module.exports = mongoose.model('Book', bookSchema);
