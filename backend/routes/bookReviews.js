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

function getSort(sortValue) {
    switch (sortValue) {
        case "rating_asc":
            return { rating: 1, createdAt: -1 };
        case "rating_desc":
            return { rating: -1, createdAt: -1 };
        case "oldest":
            return { createdAt: 1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
}

// get all books that have reviews in YOUR database
router.get("/search-books", async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        const pipeline = [
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "book",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: "$reviews" },
                    averageRatingDb: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.rating" },
                            0
                        ]
                    }
                }
            },
            {
                $match: {
                    reviewCount: { $gt: 0 },
                    ...(q ? { title: { $regex: q, $options: "i" } } : {})
                }
            },
            {
                $project: {
                    title: 1,
                    authors: 1,
                    thumbnail: 1,
                    averageRatingDb: 1,
                    reviewCount: 1
                }
            },
            {
                $sort: { title: 1 }
            }
        ];

        const books = await Book.aggregate(pipeline);
        return res.status(200).json({ books });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

// only books in the user's hasRead list that they have NOT reviewed yet
router.get("/user-hasread/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const q = String(req.query.q || "").trim().toLowerCase();

        const user = await User.findById(userId).populate("hasRead");
        if (!user) return res.status(404).json({ message: "User not found." });

        const existingReviews = await Review.find({ user: userId }).select("book");
        const reviewedBookIds = new Set(existingReviews.map(r => r.book.toString()));

        const books = (user.hasRead || []).filter((book) => {
            const notReviewedYet = !reviewedBookIds.has(book._id.toString());
            const matchesQuery =
                !q ||
                book.title.toLowerCase().includes(q) ||
                (book.authors || []).some(author => author.toLowerCase().includes(q));

            return notReviewedYet && matchesQuery;
        });

        return res.status(200).json({ books });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.get("/view/:bookId", async (req, res) => {
    try {
        const { bookId } = req.params;
        const sort = String(req.query.sort || "newest");
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.max(parseInt(req.query.limit || "5", 10), 1);
        const skip = (page - 1) * limit;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found." });

        const totalReviews = await Review.countDocuments({ book: bookId });

        const reviews = await Review.find({ book: bookId })
            .sort(getSort(sort))
            .skip(skip)
            .limit(limit)
            .populate("user", "firstName lastName");

        const stats = await Review.aggregate([
            { $match: { book: new mongoose.Types.ObjectId(bookId) } },
            {
                $group: {
                    _id: "$book",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            message: "Reviews display success.",
            book,
            averageRating: stats[0]?.averageRating || 0,
            reviewCount: stats[0]?.reviewCount || 0,
            reviews,
            page,
            totalPages: Math.max(Math.ceil(totalReviews / limit), 1)
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
        if (numericRating < 0.5 || numericRating > 5 || (numericRating * 2) % 1 !== 0) {
            return abortAndEnd(session, res, 400, "Rating must be between 0.5 and 5 in 0.5 increments.");
        }

        const book = await Book.findById(bookId).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const hasRead = user.hasRead.some(id => id.toString() === bookId);
        if (!hasRead) return abortAndEnd(session, res, 403, "You can only review books in your Has Read list.");

        const existingReview = await Review.findOne({ user: userId, book: bookId }).session(session);
        if (existingReview) return abortAndEnd(session, res, 400, "You already reviewed this book.");

        const review = new Review({
            user: userId,
            book: bookId,
            rating: numericRating,
            reviewText
        });
        await review.save({ session });

        const stats = await Review.aggregate([
            { $match: { book: new mongoose.Types.ObjectId(bookId) } },
            {
                $group: {
                    _id: "$book",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            }
        ]).session(session);

        book.averageRating = stats[0]?.averageRating || 0;
        book.ratingsCount = stats[0]?.reviewCount || 0;
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

        const bookId = review.book;
        const book = await Book.findById(bookId).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        await Review.findByIdAndDelete(reviewId).session(session);

        const stats = await Review.aggregate([
            { $match: { book: new mongoose.Types.ObjectId(bookId) } },
            {
                $group: {
                    _id: "$book",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            }
        ]).session(session);

        book.averageRating = stats[0]?.averageRating || 0;
        book.ratingsCount = stats[0]?.reviewCount || 0;
        await book.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Review deleted successfully." });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
