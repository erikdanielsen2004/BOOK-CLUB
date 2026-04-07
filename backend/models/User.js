const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        joinedGroups: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group'
            }
        ],
        createdGroups: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group'
            }
        ],
        hasRead: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            }
        ],
        reading: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            }
        ],
        wantsToRead: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
