const express = require('express');
const mongoose = require('mongoose');
const User = require("../models/User.js");
const Group = require("../models/Group.js");
const router = express.Router();

async function abortAndEnd(session, res, status, message) {
    try { await session.abortTransaction(); }
    catch (error) {}
    finally { session.endSession(); }
    return res.status(status).json({ message });
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

        const isMember = group.members.some(member => member.toString() === userId);
        if (!isMember) return abortAndEnd(session, res, 403, "You must be a group member to vote.");

        if (!group.voteSessionActive || !group.voteStartAt || !group.voteEndAt) {
            return abortAndEnd(session, res, 400, "There is no active vote.");
        }

        if (new Date() > new Date(group.voteEndAt)) {
            group.voteSessionActive = false;
            await group.save({ session });
            return abortAndEnd(session, res, 400, "Voting period has ended.");
        }

        const candidateExists = group.bookCandidates.some(book => book.toString() === bookId);
        if (!candidateExists) {
            return abortAndEnd(session, res, 404, "Book is not a valid candidate for this group.");
        }

        group.votes = (group.votes || []).filter(vote => !vote.user.equals(user._id));
        group.votes.push({ user: user._id, book: bookId });

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
            message: "Vote cast successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/vote-ended/:userId/:groupId", async (req, res) => {
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

        if (!group.voteSessionActive && !group.voteEndAt) {
            return abortAndEnd(session, res, 400, "There is no vote to end.");
        }

        if (!group.votes || group.votes.length === 0) {
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
                message: "Vote ended. No votes were cast, so the current book did not change.",
                group: mapGroup(populatedGroup)
            });
        }

        const voteCount = {};
        for (const vote of group.votes) {
            const id = vote.book.toString();
            voteCount[id] = (voteCount[id] || 0) + 1;
        }

        let winningBookId = null;
        let maxVotes = -1;

        for (const candidateId of group.bookCandidates) {
            const id = candidateId.toString();
            const count = voteCount[id] || 0;

            if (count > maxVotes) {
                maxVotes = count;
                winningBookId = id;
            }
        }

        if (!winningBookId) {
            return abortAndEnd(session, res, 400, "Winning book not found.");
        }

        group.currentBook = winningBookId;
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
            message: "Vote ended successfully.",
            currentBook: populatedGroup.currentBook,
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
