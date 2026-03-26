const express require("express");
const bcrypt require("bcryptjs");
const jwt require("jsonwebtoken");
const User require("../models/User.js");

const router = express.Router();

// @route   /signup
// @desc    Register user
// @access  Public
router.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, passwordHash } = req.body;

        // 1. Validate input
        if (!firstName || !lastName || !email || !passwordHash) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        /*
        if (passwordHash.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters" });
        }
        */
        // 2. Check if user exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: "User already exists" });
        }
        /*
        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        */
        /*
        // 4. Create user
        user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });
        await user.save();
        */

        const user = await User.create(req.body);
        /*
        // 5. Create JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // 6. Send response
        res.status(201).json({
            msg: "User registered successfully",
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
        */
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
