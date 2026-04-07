const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User.js");
const router = express.Router();

function sendError(res, status, message) { return res.status(status).json({ message }); }

router.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) return sendError(res, 400, "All fields are required.");
        if (!validator.isEmail(email)) return sendError(res, 400, "Invalid email.");

        const baseEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: baseEmail });
        if (existingUser) return sendError(res, 400, "User already exists.");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: baseEmail,
            password: hashedPassword
        });
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: "User registered successfully.",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error.message);
        if (error.code === 11000 || error.message.includes("duplicate key")) {
            return sendError(res, 400, "User already exists.");
        }
        return sendError(res, 500, "Server error.");
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return sendError(res, 400, "All fields are required.");

        const baseEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: baseEmail });
        if (!user) return sendError(res, 401, "Email or password is incorrect.");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return sendError(res, 401, "Email or password is incorrect.");

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: "Success",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error.message);
        return sendError(res, 500, "Server error.");
    }
});

module.exports = router;
