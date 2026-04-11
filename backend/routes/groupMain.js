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
                thumbnail: book.thumbnail || '',
                description: book.description || '',
                categories: Array.isArray(book.categories) ? book.categories : [],
                pageCount: book.pageCount || 0,
                publishedDate: book.publishedDate || '',
                averageRating: book.averageRating || 0,
                ratingsCount: book.ratingsCount || 0
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

async function getPopulatedGroup(groupId) {
    return Group.findById(groupId)
        .populate("owner", "firstName lastName")
        .populate("members", "firstName lastName")
        .populate("currentBook", "title authors thumbnail googleBooksId")
        .populate("bookCandidates", "googleBooksId title authors thumbnail description categories pageCount publishedDate averageRating ratingsCount")
        .populate("votes.user", "firstName lastName")
        .populate("votes.book", "title authors thumbnail");
}

router.get("/search", async (req, res) => {
    try {
        const { searchBar } = req.query;

        let query = {};
        if (searchBar) {
            query = {
                $or: [
                    { name: { $regex: searchBar, $options: "i" } },
                    { description: { $regex: searchBar, $options: "i" } }
                ]
            };
        }

        const groups = await Group.find(query)
            .populate("owner", "firstName lastName")
            .populate("members", "firstName lastName")
            .populate("currentBook", "title authors thumbnail googleBooksId")
            .populate("bookCandidates", "googleBooksId title authors thumbnail description categories pageCount publishedDate averageRating ratingsCount")
            .populate("votes.user", "firstName lastName")
            .populate("votes.book", "title authors thumbnail")
            .sort({ createdAt: -1 });

        return res.status(200).json({ message: "Search success.", groups: groups.map(mapGroup) });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.get("/search/:userId", async (req, res) => {
    try {
        const { searchBar } = req.query;
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        let query = { _id: { $in: user.joinedGroups } };
        if (searchBar) {
            query.$or = [
                { name: { $regex: searchBar, $options: "i" } },
                { description: { $regex: searchBar, $options: "i" } }
            ];
        }

        const groups = await Group.find(query)
            .populate("owner", "firstName lastName")
            .populate("members", "firstName lastName")
            .populate("currentBook", "title authors thumbnail googleBooksId")
            .populate("bookCandidates", "googleBooksId title authors thumbnail description categories pageCount publishedDate averageRating ratingsCount")
            .populate("votes.user", "firstName lastName")
            .populate("votes.book", "title authors thumbnail")
            .sort({ createdAt: -1 });

        return res.status(200).json({ message: "Search success.", groups: groups.map(mapGroup) });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error." });
    }
});

router.post("/create/:userId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, description } = req.body;
        const { userId } = req.params;

        if (!name || name.trim() === "") return abortAndEnd(session, res, 400, "Group name cannot be empty.");

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const group = new Group({
            name: name.trim(),
            description: description?.trim() || "",
            owner: userId,
            members: [userId],
            bookCandidates: [],
            votes: [],
            voteSessionActive: false,
            voteStartAt: null,
            voteEndAt: null
        });

        await group.save({ session });

        user.createdGroups.push(group._id);
        user.joinedGroups.push(group._id);
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedGroup = await getPopulatedGroup(group._id);

        return res.status(201).json({
            message: "Group created successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.put("/edit/:userId/:groupId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, groupId } = req.params;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return abortAndEnd(session, res, 400, "Group name cannot be empty.");
        }

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const group = await Group.findById(groupId).session(session);
        if (!group) return abortAndEnd(session, res, 404, "Group not found.");
        if (group.owner.toString() !== userId) return abortAndEnd(session, res, 403, "Access denied.");

        group.name = name.trim();
        group.description = description?.trim() || "";
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedGroup = await getPopulatedGroup(groupId);

        return res.status(200).json({
            message: "Group updated successfully.",
            group: mapGroup(populatedGroup)
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.delete("/delete/:userId/:groupId", async (req, res) => {
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

        await User.updateMany(
            { _id: { $in: group.members } },
            { $pull: { joinedGroups: groupId, createdGroups: groupId } },
            { session }
        );

        await Group.findByIdAndDelete(groupId).session(session);

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Group deleted successfully." });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/join/:userId/:groupId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, groupId } = req.params;

        const user = await User.findById(userId).session(session);
        const group = await Group.findById(groupId).session(session);
        if (!user || !group) return abortAndEnd(session, res, 404, "User or group not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const isMember = group.members.some(member => member.toString() === userId);
        if (isMember) return abortAndEnd(session, res, 409, "User is already in this group.");

        group.members = [...new Set([...group.members, user._id])];
        user.joinedGroups = [...new Set([...user.joinedGroups, group._id])];

        await group.save({ session });
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ message: "Group joined successfully." });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/leave/:userId/:groupId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, groupId } = req.params;
        let ownerTransfer = false;

        const user = await User.findById(userId).session(session);
        const group = await Group.findById(groupId).session(session);
        if (!user || !group) return abortAndEnd(session, res, 404, "User or group not found.");
        if (!user.isVerified) return abortAndEnd(session, res, 401, "Please verify your email.");

        const isMember = group.members.some(member => member.toString() === userId);
        if (!isMember) return abortAndEnd(session, res, 400, "User is not in this group.");

        if (group.owner.toString() === userId) {
            ownerTransfer = true;

            if (group.members.length === 1) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { joinedGroups: group._id, createdGroups: group._id } },
                    { session }
                );
                await Group.findByIdAndDelete(groupId).session(session);

                await session.commitTransaction();
                session.endSession();
                return res.status(200).json({ message: "Left and deleted group successfully." });
            }

            const newOwner = group.members.find(member => member.toString() !== userId);
            group.owner = newOwner;
        }

        group.members = group.members.filter(member => member.toString() !== userId);
        user.joinedGroups = user.joinedGroups.filter(group => group.toString() !== groupId);
        user.createdGroups = user.createdGroups.filter(group => group.toString() !== groupId);
        group.votes = group.votes.filter(vote => vote.user.toString() !== userId);

        await group.save({ session });
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        const response = { message: "Group left successfully." };
        if (ownerTransfer) response.newOwner = group.owner;
        return res.status(200).json(response);

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
