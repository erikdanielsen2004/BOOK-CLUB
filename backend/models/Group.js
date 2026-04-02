const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    }
  },
  { _id: true, timestamps: true }
);

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
    }],
    votes: [voteSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
