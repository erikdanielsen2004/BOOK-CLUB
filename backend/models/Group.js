
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
    {

        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        currentBook: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        },
        bookCandidates: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        }]

    }
);

module.exports = mongoose.model('Group', groupSchema);