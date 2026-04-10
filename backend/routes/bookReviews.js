const express = require('express');
const mongoose = require('mongoose');
const User = require("../models/User.js");
const Book = require("../models/Book.js");
const Review = require("../models/Review.js");
const router = express.Router();

async function abortAndEnd(session, res, status, message) {
    try { await session.abortTransaction(); }
    catch (error) {}
    finally { session.endSession(); }
    return res.status(status).json({ message });
}

router.get("/reviews/:bookId", async (req, res) => {
    try {
        
        const { bookId } = req.params;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found." });

        const reviews = await Review.find({ book: bookId }).sort({ createdAt: -1 }).populate("user", "firstName lastName");

        return res.status(200).json({ message: "Reviews display success.", book, reviews });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.post("/create-review/:bookId/:userId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        
        const { rating, reviewText } = req.body;
        const { bookId, userId } = req.params;

        const book = await Book.findById(bookId).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const existingReview = await Review.findOne({ user: userId, book: bookId }).session(session);
        if (existingReview) return abortAndEnd(session, res, 400, "You already reviewed this book.");

        const review = new Review({
            user: userId,
            book: bookId,
            rating,
            reviewText
        });
        await review.save({ session });

        const oldRatingCount = book.ratingsCount ?? 0;
        const oldAvgRating = book.averageRating ?? 0;
        ++book.ratingsCount;
        book.averageRating = ( (oldAvgRating * oldRatingCount) + rating ) / book.ratingsCount;
        await book.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({ message: "Review created successfully.", review });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
