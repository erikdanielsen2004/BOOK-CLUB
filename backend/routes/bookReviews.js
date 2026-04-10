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

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get("/search-books", async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        const query = { ratingsCount: { $gt: 0 } };

        if (q) {
            query.title = { $regex: escapeRegex(q), $options: "i" };
        }

        const books = await Book.find(query)
            .sort({ averageRating: -1, ratingsCount: -1, title: 1 })
            .limit(20);

        return res.status(200).json({ books });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.get("/reviewable/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const q = (req.query.q || "").trim();

        const user = await User.findById(userId).populate("hasRead");
        if (!user) return res.status(404).json({ message: "User not found." });

        let books = user.hasRead || [];

        if (q) {
            const lower = q.toLowerCase();
            books = books.filter((book) =>
                book.title?.toLowerCase().includes(lower) ||
                (book.authors || []).join(" ").toLowerCase().includes(lower)
            );
        }

        const existingReviews = await Review.find({ user: userId }).select("book");
        const reviewedIds = new Set(existingReviews.map(r => r.book.toString()));

        const reviewableBooks = books.filter((book) => !reviewedIds.has(book._id.toString()));

        return res.status(200).json({ books: reviewableBooks });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.get("/view/:bookId", async (req, res) => {
    try {
        const { bookId } = req.params;
        const sort = req.query.sort || "newest";
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = 5;
        const skip = (page - 1) * limit;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found." });

        let sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };
        if (sort === "rating_desc") sortOption = { rating: -1, createdAt: -1 };
        if (sort === "rating_asc") sortOption = { rating: 1, createdAt: -1 };

        const totalReviews = await Review.countDocuments({ book: bookId });
        const reviews = await Review.find({ book: bookId })
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate("user", "firstName lastName");

        return res.status(200).json({
            message: "Reviews display success.",
            book,
            reviews,
            page,
            totalPages: Math.max(Math.ceil(totalReviews / limit), 1),
            totalReviews
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.post("/create/:bookId/:userId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { rating, reviewText } = req.body;
        const { bookId, userId } = req.params;

        const numericRating = Number(rating);
        if (!numericRating || numericRating < 0.5 || numericRating > 5 || !Number.isInteger(numericRating * 2)) {
            return abortAndEnd(session, res, 400, "Rating must be between 0.5 and 5 in 0.5 increments.");
        }

        const book = await Book.findById(bookId).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const hasReadBook = user.hasRead.some(id => id.toString() === bookId);
        if (!hasReadBook) return abortAndEnd(session, res, 403, "You can only review books in your Has Read list.");

        const existingReview = await Review.findOne({ user: userId, book: bookId }).session(session);
        if (existingReview) return abortAndEnd(session, res, 400, "You already reviewed this book.");

        const review = new Review({
            user: userId,
            book: bookId,
            rating: numericRating,
            reviewText: reviewText || ""
        });
        await review.save({ session });

        const oldRatingCount = book.ratingsCount ?? 0;
        const oldAvgRating = book.averageRating ?? 0;
        book.ratingsCount = oldRatingCount + 1;
        book.averageRating = ((oldAvgRating * oldRatingCount) + numericRating) / book.ratingsCount;
        await book.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({ message: "Review created successfully.", review });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.delete("/delete/:userId/:reviewId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, reviewId } = req.params;

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const review = await Review.findOne({ _id: reviewId, user: userId }).session(session);
        if (!review) return abortAndEnd(session, res, 404, "Review not found.");

        const book = await Book.findById(review.book).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        const oldRatingCount = book.ratingsCount ?? 0;
        const oldAvgRating = book.averageRating ?? 0;
        book.ratingsCount = Math.max(oldRatingCount - 1, 0);

        if (book.ratingsCount === 0) {
            book.averageRating = 0;
        } else {
            book.averageRating = ((oldAvgRating * oldRatingCount) - review.rating) / book.ratingsCount;
        }

        await book.save({ session });
        await Review.findByIdAndDelete(reviewId).session(session);

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Review deleted successfully." });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
