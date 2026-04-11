const express = require('express');
const mongoose = require('mongoose');
const User = require("../models/User.js");
const Book = require('../models/Book.js');
const Group = require("../models/Group.js");
const router = express.Router();

async function abortAndEnd(session, res, status, message) {
    try { await session.abortTransaction(); }
    catch (error) {}
    finally { session.endSession(); }
    return res.status(status).json({ message });
}

router.post("/cast-vote/:userId/:groupId/:bookId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        
        const { userId, groupId, bookId } = req.params;

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const group = await Group.findById(groupId).session(session);
        if (!group) return abortAndEnd(session, res, 404, "Group not found.");
        
        const book = await Book.findById(bookId).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        group.votes = (group.votes || []).filter(vote => !vote.user.equals(user._id));
        group.votes.push({ user: user._id, book: book._id });
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Vote cast successfully." });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/vote-ended/:groupId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId).session(session);
        if (!group) return abortAndEnd(session, res, 404, "Group not found.");

        if (!group.votes || group.votes.length === 0) return abortAndEnd(session, res, 400, "No one has voted.");

        const voteCount = {};
        for (const vote of group.votes) {
            const bookId = vote.book.toString();
            voteCount[bookId] = (voteCount[bookId] || 0) + 1;
        }

        let winningBookId = null;
        let maxVotes = 0;
        for (const [bookId, count] of Object.entries(voteCount)) {
            if (count > maxVotes) {
                maxVotes = count;
                winningBookId = bookId;
            }
        }
        if (!winningBookId) return abortAndEnd(session, res, 400, "Winning book not found.");

        const book = await Book.findById(winningBookId).session(session);
        if (!book) return abortAndEnd(session, res, 404, "Book not found.");

        group.currentBook = winningBookId;
        group.votes = [];
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Vote ended successfully.", currentBook: group.currentBook });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
