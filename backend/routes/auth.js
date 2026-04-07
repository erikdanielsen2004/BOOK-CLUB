const express = require("express");
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");
const router = express.Router();

async function abortAndEnd(session, res, status, message) {
    await session.abortTransaction();
    session.endSession();
    return res.status(status).json({ message });
}

router.post("/signup", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { firstName, lastName, email, passwordHash } = req.body;

        if (!firstName || !lastName || !email || !passwordHash) {
            return abortAndEnd(session, res, 400, "All fields are required.");
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() }).session(session);
        if (existingUser) return abortAndEnd(session, res, 400, "User already exists.");

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(passwordHash, salt);

        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            newHash,
            salt
        });
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

router.post("/login", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { email, passwordHash } = req.body;

        if (!email || !passwordHash) {
            return abortAndEnd(session, res, 400, "All fields are required.");
        }

        const salt = User.findOne( {email: email.toLowerCase().trim()}, {_id: 0, salt: 1} ).session(session);
        const newHash = await bcrypt.hash(passwordHash, salt);

        const user = await User.findOne({ email: email.toLowerCase().trim(), newHash }).session(session);
        if (!user) return abortAndEnd(session, res, 401, "Email or password is incorrect.");

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            message: "Success",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error.message);
        return abortAndEnd(session, res, 500, "Server error.");
    }
});

module.exports = router;
