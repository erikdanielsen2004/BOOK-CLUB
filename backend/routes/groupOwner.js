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

function normalizeBookPayload(body) {
    return {
        googleBooksId: body.googleBooksId,
        title: body.title || 'Untitled',
        authors: Array.isArray(body.authors) ? body.authors : [],
        description: body.description || '',
        categories: Array.isArray(body.categories) ? body.categories : [],
        thumbnail: body.thumbnail || '',
        pageCount: body.pageCount || 0,
        publishedDate: body.publishedDate || '',
        averageRating: 0,
        ratingsCount: 0
    };
}

router.post("/add-to-list/:userId/:groupId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        
        const { userId, groupId } = req.params;

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const group = await Group.findById(groupId).session(session);
        if (!group) return abortAndEnd(session, res, 404, "Group not found.");
        if (group.owner.toString() !== userId) return abortAndEnd(session, res, 403, "Access denied.");

        const payload = normalizeBookPayload(req.body);
        if (!payload.googleBooksId) return abortAndEnd(session, res, 400, "googleBooksId is required.");

        let book = await Book.findOne({ googleBooksId: payload.googleBooksId }).session(session);
        if (!book) book = (await Book.create([payload], { session }))[0];

        if (group.bookCandidates.some(id => id.equals(book._id))) return abortAndEnd(session, res, 400, "Book already on list.");
        if (group.bookCandidates.length >= 10) return abortAndEnd(session, res, 400, "Limit of books reached (10).");
        
        group.bookCandidates.push(book._id);
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Book added successfully." });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/:userId/:groupId/publish-list", async (req, res) => {
    try {
        
        const { userId, groupId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (!user.isVerified) return res.status(401).json({ message: "Please verify your email." });

        const group = await Group.findById(groupId).populate("bookCandidates");
        if (!group) return res.status(404).json({ message: "Group not found." });
        if (group.owner.toString() !== userId) return res.status(403).json({ message: "Access denied." });

        if (group.bookCandidates.length < 2) return res.status(400).json({ message: "Must have at least 2 books." });
        
        group.votes = [];
        await group.save();

        return res.status(200).json({ message: "List published successfully.", bookCandidates: group.bookCandidates });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
