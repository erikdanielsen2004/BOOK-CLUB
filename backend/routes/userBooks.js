const express = require('express');
const router = express.Router();

const {
    addBookToList,
    moveBookBetweenLists,
    removeBookFromList,
    getUserBooks
} = require('../controllers/userBooksController');

// Get all lists
router.get('/:userId', getUserBooks);

// Add book to a list
router.post('/:userId/:list', addBookToList);

// Move book between lists
router.put('/:userId/move', moveBookBetweenLists);

// Remove book
router.delete('/:userId/:list/:bookId', removeBookFromList);

module.exports = router;