const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

function normalizeBook(item) {
    const info = item.volumeInfo || {};
    const imageLinks = info.imageLinks || {};

    return {
        googleBooksId: item.id || '',
        title: info.title || 'Untitled',
        authors: Array.isArray(info.authors) ? info.authors : [],
        description: info.description || '',
        categories: Array.isArray(info.categories) ? info.categories : [],
        thumbnail:
            imageLinks.thumbnail ||
            imageLinks.smallThumbnail ||
            '',
        pageCount: info.pageCount || 0,
        publishedDate: info.publishedDate || '',
        averageRating: info.averageRating || 0,
        ratingsCount: info.ratingsCount || 0
    };
}

router.get('/books', async (req, res) => {
    try {
        let {
            q = '',
            category = '',
            startIndex = 0,
            maxResults = 12,
            orderBy = 'relevance'
        } = req.query;

        q = String(q).trim();
        category = String(category).trim();
        startIndex = Number(startIndex) || 0;
        maxResults = Number(maxResults) || 12;

        if (!q && !category) {
            return res.status(400).json({ message: 'Search query or category is required.' });
        }

        if (maxResults > 40) maxResults = 40;
        if (startIndex < 0) startIndex = 0;
        if (orderBy !== 'newest') orderBy = 'relevance';

        let googleQuery = q;
        if (category) {
            googleQuery = googleQuery
                ? `${googleQuery}+subject:${category}`
                : `subject:${category}`;
        }

        let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleQuery)}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=${orderBy}`;

        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        if (apiKey) {
            url += `&key=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: data.error?.message || 'Google Books API request failed.'
            });
        }

        const items = Array.isArray(data.items) ? data.items : [];
        const books = items.map(normalizeBook);

        return res.status(200).json({
            totalItems: data.totalItems || 0,
            books
        });

    } catch (error) {
        console.error('Google Books search error:', error.message);
        return res.status(500).json({ message: 'Server error while searching books.' });
    }
});

module.exports = router;
