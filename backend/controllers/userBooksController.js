const User = require('../models/User');
const Book = require('../models/Book');

const validLists = ['hasRead', 'reading', 'wantsToRead'];


// Get all user books (populated)
exports.getUserBooks = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('hasRead')
            .populate('reading')
            .populate('wantsToRead');

        res.json({
            hasRead: user.hasRead,
            reading: user.reading,
            wantsToRead: user.wantsToRead
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Add book to list (with upsert from Google Books)
exports.addBookToList = async (req, res) => {
    try {
        const { userId, list } = req.params;

        if (!validLists.includes(list)) {
            return res.status(400).json({ error: 'Invalid list' });
        }

        const {
            googleBooksId,
            title,
            authors,
            description,
            categories,
            thumbnail,
            pageCount,
            publishedDate,
            averageRating,
            ratingsCount
        } = req.body;

        // Find or create book
        let book = await Book.findOne({ googleBooksId });

        if (!book) {
            book = await Book.create({
                googleBooksId,
                title,
                authors,
                description,
                categories,
                thumbnail,
                pageCount,
                publishedDate,
                averageRating,
                ratingsCount
            });
        }

        // Add to user list (avoid duplicates)
        const user = await User.findById(userId);

        if (!user[list].includes(book._id)) {
            user[list].push(book._id);
        }

        await user.save();

        res.json({ message: 'Book added', bookId: book._id });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Move book between lists
exports.moveBookBetweenLists = async (req, res) => {
    try {
        const { userId } = req.params;
        const { from, to, bookId } = req.body;

        if (!validLists.includes(from) || !validLists.includes(to)) {
            return res.status(400).json({ error: 'Invalid list' });
        }

        const user = await User.findById(userId);

        // Remove from old list
        user[from] = user[from].filter(id => id.toString() !== bookId);

        // Add to new list if not already there
        if (!user[to].includes(bookId)) {
            user[to].push(bookId);
        }

        await user.save();

        res.json({ message: 'Book moved' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Remove book from list
exports.removeBookFromList = async (req, res) => {
    try {
        const { userId, list, bookId } = req.params;

        if (!validLists.includes(list)) {
            return res.status(400).json({ error: 'Invalid list' });
        }

        const user = await User.findById(userId);

        user[list] = user[list].filter(id => id.toString() !== bookId);

        await user.save();

        res.json({ message: 'Book removed' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};