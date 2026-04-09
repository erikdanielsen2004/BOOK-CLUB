const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User.js");
const sendResetEmail = require('../utils/resetEmail.js');
const router = express.Router();

function sendError(res, status, message) { return res.status(status).json({ message }); }

router.post("/send-reset-email", async (req, res) => {
    try {
        
        const { email } = req.body;

        if (!validator.isEmail(email)) return sendError(res, 400, "Invalid email.");

        const baseEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: baseEmail });
        if (!user) return res.status(200).json({ message: "Reset email sent." });
        
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_RESET_PASS_EXPIRES_IN }
        );

        await sendResetEmail(user.email, resetToken).catch((error) => console.error("Email send failed.", error));
        return res.status(200).json({ message: "Reset email sent." });

    } catch (error) {
        console.error(error);
        return sendError(res, 500, "Server error.");
    }
});

router.post("/reset-password/:token", async (req, res) => {

    try {
        
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return sendError(res, 404, "User not found.");

        const { newPassword, confirmNewPassword } = req.body;
        const passwordRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
        if (!newPassword || !confirmNewPassword) return sendError(res, 400, "All fields are required.");
        if (newPassword !== confirmNewPassword) return sendError(res, 400, "Passwords do not match.");
        if (newPassword.length < 7) return sendError(res, 400, "Password should be at least 7 characters.");
        if (!passwordRegEx.test(newPassword))
            return sendError(res, 400, "Password should contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Password changed successfully." });

    } catch (error) {
        console.error(error);
        return sendError(res, 400, "Invalid or expired password reset link.");
    }
});