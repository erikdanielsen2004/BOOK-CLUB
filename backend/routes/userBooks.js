const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Book = require('../models/Book.js');

const validLists = ['hasRead', 'reading', 'wantsToRead'];

function normalizeBookPayload(body) {
    return {
        googleBooksId: body.googleBooksId,
        title: body.title || 'Untitled',
        authors: Array.isArray(body.authors) ? body.authors : [],
        description: body.description || '',
        categories: Array.isArray(body.categories) ? body.categories : [],
        thumbnail: body.thumbnail || '',
        pageCount: body.pageCount || 0,
        publishedDate: body.publishedDate || '',
        averageRating: body.averageRating || 0,
        ratingsCount: body.ratingsCount || 0
    };
}

// get all user lists
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('hasRead')
            .populate('reading')
            .populate('wantsToRead');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({
            hasRead: user.hasRead,
            reading: user.reading,
            wantsToRead: user.wantsToRead
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// add book to one list only, remove from all others first
router.post('/:userId/:list', async (req, res) => {
    try {
        const { userId, list } = req.params;

        if (!validLists.includes(list)) {
            return res.status(400).json({ message: 'Invalid list.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const payload = normalizeBookPayload(req.body);

        if (!payload.googleBooksId) {
            return res.status(400).json({ message: 'googleBooksId is required.' });
        }

        let book = await Book.findOne({ googleBooksId: payload.googleBooksId });

        if (!book) {
            book = await Book.create(payload);
        }

        const bookId = book._id.toString();

        user.hasRead = user.hasRead.filter(id => id.toString() !== bookId);
        user.reading = user.reading.filter(id => id.toString() !== bookId);
        user.wantsToRead = user.wantsToRead.filter(id => id.toString() !== bookId);

        user[list].push(book._id);

        await user.save();

        return res.status(200).json({
            message: `Book added to ${list}.`,
            book
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// move book from one list to another
router.put('/:userId/move', async (req, res) => {
    try {
        const { userId } = req.params;
        const { to, bookId } = req.body;

        if (!validLists.includes(to)) {
            return res.status(400).json({ message: 'Invalid destination list.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.hasRead = user.hasRead.filter(id => id.toString() !== bookId);
        user.reading = user.reading.filter(id => id.toString() !== bookId);
        user.wantsToRead = user.wantsToRead.filter(id => id.toString() !== bookId);

        user[to].push(bookId);

        await user.save();

        return res.status(200).json({ message: 'Book moved successfully.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// remove book from a list
router.delete('/:userId/:list/:bookId', async (req, res) => {
    try {
        const { userId, list, bookId } = req.params;

        if (!validLists.includes(list)) {
            return res.status(400).json({ message: 'Invalid list.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user[list] = user[list].filter(id => id.toString() !== bookId);

        await user.save();

        return res.status(200).json({ message: 'Book removed successfully.' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;
