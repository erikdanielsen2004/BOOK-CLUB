import { useState } from 'react';

type Book = {
  googleBooksId: string;
  title: string;
  authors: string[];
  description: string;
  categories: string[];
  thumbnail: string;
  pageCount: number;
  publishedDate: string;
  averageRating: number;
  ratingsCount: number;
};

function BookUI() {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function searchBook(event: any): Promise<void> {
    event.preventDefault();
    setMessage('');
    setBooks([]);

    if (!searchText.trim() && !category.trim()) {
      setMessage('Enter a search term or category.');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (searchText.trim()) params.append('q', searchText.trim());
      if (category.trim()) params.append('category', category.trim());

      const response = await fetch(`/api/search/books?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Search failed.');
        setLoading(false);
        return;
      }

      setBooks(data.books || []);
      if (!data.books || data.books.length === 0) {
        setMessage('No books found.');
      }
    } catch (error) {
      setMessage('Could not search books.');
    }

    setLoading(false);
  }

  return (
    <div id="bookUIDiv" style={{ padding: '2rem' }}>
      <h2>Search Books</h2>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          type="text"
          id="searchText"
          placeholder="Book title, author, keyword..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ padding: '0.7rem', minWidth: '260px' }}
        />

        <input
          type="text"
          id="categoryText"
          placeholder="Category like fiction, fantasy..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.7rem', minWidth: '220px' }}
        />

        <button
          type="button"
          id="searchBookButton"
          className="buttons"
          onClick={searchBook}
        >
          Search Book
        </button>
      </div>

      {loading && <p>Searching...</p>}
      {message && <p>{message}</p>}

      <div
        id="bookList"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}
      >
        {books.map((book) => (
          <div
            key={book.googleBooksId}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '1rem',
              backgroundColor: '#fff'
            }}
          >
            {book.thumbnail && (
              <img
                src={book.thumbnail}
                alt={book.title}
                style={{
                  width: '100%',
                  height: '260px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '0.75rem'
                }}
              />
            )}

            <h3 style={{ marginBottom: '0.5rem' }}>{book.title}</h3>

            <p><strong>Author(s):</strong> {book.authors?.length ? book.authors.join(', ') : 'Unknown'}</p>
            <p><strong>Category:</strong> {book.categories?.length ? book.categories.join(', ') : 'None'}</p>
            <p><strong>Published:</strong> {book.publishedDate || 'Unknown'}</p>
            <p><strong>Pages:</strong> {book.pageCount || 'N/A'}</p>
            <p><strong>Rating:</strong> {book.averageRating || 'N/A'}</p>

            {book.description && (
              <p style={{ marginTop: '0.75rem' }}>
                {book.description.length > 180
                  ? `${book.description.substring(0, 180)}...`
                  : book.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookUI;
