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
        averageRating: typeof body.averageRating === 'number' ? body.averageRating : 0,
        ratingsCount: typeof body.ratingsCount === 'number' ? body.ratingsCount : 0
    };
}

function mapGroup(group) {
    return {
        _id: group._id,
        name: group.name,
        description: group.description || '',
        owner: group.owner?._id || group.owner,
        members: Array.isArray(group.members)
            ? group.members.map((member) => ({
                _id: member._id,
                firstName: member.firstName || '',
                lastName: member.lastName || ''
            }))
            : [],
        currentBook: group.currentBook
            ? {
                _id: group.currentBook._id,
                title: group.currentBook.title || 'Untitled',
                authors: Array.isArray(group.currentBook.authors) ? group.currentBook.authors : [],
                thumbnail: group.currentBook.thumbnail || ''
            }
            : null,
        bookCandidates: Array.isArray(group.bookCandidates)
            ? group.bookCandidates.map((book) => ({
                _id: book._id,
                googleBooksId: book.googleBooksId || '',
                title: book.title || 'Untitled',
                authors: Array.isArray(book.authors) ? book.authors : [],
                thumbnail: book.thumbnail || ''
            }))
            : [],
        votes: Array.isArray(group.votes)
            ? group.votes.map((vote) => ({
                _id: vote._id,
                user: vote.user?._id || vote.user,
                book: vote.book?._id || vote.book
            }))
            : [],
        voteSessionActive: !!group.voteSessionActive,
        voteStartAt: group.voteStartAt,
        voteEndAt: group.voteEndAt,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
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

        if (group.bookCandidates.some(id => id.equals(book._id))) {
            return abortAndEnd(session, res, 400, "Book already on list.");
        }

        if (group.bookCandidates.length >= 10) {
            return abortAndEnd(session, res, 400, "Limit of books reached (10).");
        }

        group.bookCandidates.push(book._id);
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedGroup = await Group.findById(groupId)
            .populate("owner", "firstName lastName")
            .populate("members", "firstName lastName")
            .populate("currentBook", "title authors thumbnail")
            .populate("bookCandidates", "googleBooksId title authors thumbnail")
            .populate("votes.user", "firstName lastName")
            .populate("votes.book", "title authors thumbnail");

        return res.status(200).json({
            message: "Book added successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.delete("/remove-from-list/:userId/:groupId/:bookId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, groupId, bookId } = req.params;

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const group = await Group.findById(groupId).session(session);
        if (!group) return abortAndEnd(session, res, 404, "Group not found.");
        if (group.owner.toString() !== userId) return abortAndEnd(session, res, 403, "Access denied.");
        if (group.voteSessionActive) return abortAndEnd(session, res, 400, "Cannot edit candidates while voting is active.");

        group.bookCandidates = group.bookCandidates.filter(id => id.toString() !== bookId);
        group.votes = group.votes.filter(vote => vote.book.toString() !== bookId);

        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedGroup = await Group.findById(groupId)
            .populate("owner", "firstName lastName")
            .populate("members", "firstName lastName")
            .populate("currentBook", "title authors thumbnail")
            .populate("bookCandidates", "googleBooksId title authors thumbnail")
            .populate("votes.user", "firstName lastName")
            .populate("votes.book", "title authors thumbnail");

        return res.status(200).json({
            message: "Book removed successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/:userId/:groupId/publish-list", async (req, res) => {
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

        if (group.bookCandidates.length < 2) {
            return abortAndEnd(session, res, 400, "Must have at least 2 books.");
        }

        group.votes = [];
        group.voteSessionActive = false;
        group.voteStartAt = null;
        group.voteEndAt = null;

        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedGroup = await Group.findById(groupId)
            .populate("owner", "firstName lastName")
            .populate("members", "firstName lastName")
            .populate("currentBook", "title authors thumbnail")
            .populate("bookCandidates", "googleBooksId title authors thumbnail")
            .populate("votes.user", "firstName lastName")
            .populate("votes.book", "title authors thumbnail");

        return res.status(200).json({
            message: "List published successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/start-vote/:userId/:groupId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, groupId } = req.params;
        const durationDays = Number(req.body.durationDays);

        if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 7) {
            return abortAndEnd(session, res, 400, "Vote duration must be an integer from 1 to 7 days.");
        }

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const group = await Group.findById(groupId).session(session);
        if (!group) return abortAndEnd(session, res, 404, "Group not found.");
        if (group.owner.toString() !== userId) return abortAndEnd(session, res, 403, "Access denied.");

        if (group.bookCandidates.length < 2) {
            return abortAndEnd(session, res, 400, "Must have at least 2 books before starting a vote.");
        }

        const now = new Date();
        const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        group.votes = [];
        group.voteSessionActive = true;
        group.voteStartAt = now;
        group.voteEndAt = end;

        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedGroup = await Group.findById(groupId)
            .populate("owner", "firstName lastName")
            .populate("members", "firstName lastName")
            .populate("currentBook", "title authors thumbnail")
            .populate("bookCandidates", "googleBooksId title authors thumbnail")
            .populate("votes.user", "firstName lastName")
            .populate("votes.book", "title authors thumbnail");

        return res.status(200).json({
            message: "Vote started successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
