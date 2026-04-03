const express = require("express");
const User = require("../models/User.js");

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, passwordHash } = req.body;

    if (!firstName || !lastName || !email || !passwordHash) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, passwordHash } = req.body;

    if (!email || !passwordHash) {
      return res.status(400).json({ message: "Cannot have empty fields" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordHash
    });

    if (!user) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }

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
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
