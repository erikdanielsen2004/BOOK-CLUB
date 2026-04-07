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

router.post("/create/:userId", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, description } = req.body;
        const { userId } = req.params;

        if (!name || name.trim() === "") return abortAndEnd(session, res, 400, "Group name cannot be empty.");

        const user = await User.findById(userId).session(session);
        if (!user) return abortAndEnd(session, res, 404, "User not found.");

        const group = new Group({
            name,
            description,
            owner: userId,
            members: [userId],
            bookCandidates: [],
            votes: []
        });
        await group.save({ session });

        user.createdGroups.push(group._id);
        user.joinedGroups.push(group._id);
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ message: "Group created successfully.", group });

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
