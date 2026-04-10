import { useMemo, useState } from 'react';
import "../styles/Books.css";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Book = {
  googleBooksId: string;
  title: string;
  authors: string[];
  description: string;
  categories: string[];
  thumbnail: string;
  pageCount: number;
  publishedDate: string;
};

const CATEGORY_OPTIONS = [
  "",
  "Fiction",
  "Fantasy",
  "Romance",
  "Mystery",
  "Thriller",
  "Science Fiction",
  "Horror",
  "Biography",
  "History",
  "Business",
  "Young Adult",
  "Self-Help",
  "Comics",
  "Poetry",
  "Religion",
  "Travel",
  "Cooking",
  "Art",
  "Computers"
];

const getStoredUser = (): UserData | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

function BookUI() {
  const user = useMemo(() => getStoredUser(), []);
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const maxResults = 12;

  async function runSearch(nextPage = 0) {
    setMessage('');
    setMessageType('');
    setBooks([]);

    if (!searchText.trim() && !category.trim()) {
      setMessage('Enter a search term or choose a category.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.append('q', searchText.trim());
      if (category.trim()) params.append('category', category.trim());
      params.append('startIndex', String(nextPage * maxResults));
      params.append('maxResults', String(maxResults));

      const response = await fetch(`/api/search/books?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Search failed.');
        setMessageType('error');
        return;
      }

      const normalized = (data.books || []).map((book: any) => ({
        googleBooksId: book.googleBooksId,
        title: book.title,
        authors: book.authors || [],
        description: book.description || '',
        categories: book.categories || [],
        thumbnail: book.thumbnail || '',
        pageCount: book.pageCount || 0,
        publishedDate: book.publishedDate || ''
      }));

      setBooks(normalized);
      setPage(nextPage);

      if (!normalized.length) {
        setMessage('No books found.');
        setMessageType('error');
      }
    } catch {
      setMessage('Could not search books.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function addToList(book: Book, list: 'hasRead' | 'reading' | 'wantsToRead') {
    if (!user?.id) {
      setMessage('You must be logged in.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`/api/user-books/${user.id}/${list}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Could not add book.');
        setMessageType('error');
        return;
      }

      const label =
        list === "hasRead" ? "Has Read" :
        list === "reading" ? "Reading" :
        "Want to Read";

      setMessage(`Added "${book.title}" to ${label}.`);
      setMessageType('success');
    } catch {
      setMessage('Could not add book.');
      setMessageType('error');
    }
  }

  return (
    <div className="book-ui">
      <div className="book-ui__filters">
        <input
          className="book-ui__input"
          type="text"
          placeholder="Search by title, author, or keyword..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(0)}
        />

        <select
          className="book-ui__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat || "all"} value={cat}>
              {cat || "All categories"}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="book-ui__search-btn"
          onClick={() => runSearch(0)}
        >
          Search
        </button>
      </div>

      {loading && <p className="book-ui__message">Searching...</p>}
      {message && (
        <div className={`book-ui__notice ${messageType === 'success' ? 'book-ui__notice--success' : 'book-ui__notice--error'}`}>
          {message}
        </div>
      )}

      <div className="book-ui__grid">
        {books.map((book) => {
          const isExpanded = expanded[book.googleBooksId];
          const hasLongDesc = book.description && book.description.length > 180;

          return (
            <div key={book.googleBooksId} className="book-ui__card">
              <div className="book-ui__cover">
                {book.thumbnail ? (
                  <img src={book.thumbnail} alt={book.title} />
                ) : null}
              </div>

              <div className="book-ui__title">{book.title}</div>

              <div className="book-ui__meta">
                <strong>Author(s):</strong> {book.authors?.length ? book.authors.join(', ') : 'Unknown'}
              </div>

              <div className="book-ui__meta">
                <strong>Category:</strong> {book.categories?.length ? book.categories.join(', ') : 'None'}
              </div>

              <div className="book-ui__meta">
                <strong>Published:</strong> {book.publishedDate || 'Unknown'}
              </div>

              <div className="book-ui__meta">
                <strong>Pages:</strong> {book.pageCount || 'N/A'}
              </div>

              {book.description && (
                <>
                  <div className="book-ui__desc">
                    {isExpanded || !hasLongDesc
                      ? book.description
                      : `${book.description.substring(0, 180)}...`}
                  </div>

                  {hasLongDesc && (
                    <button
                      type="button"
                      className="book-ui__desc-btn"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [book.googleBooksId]: !prev[book.googleBooksId]
                        }))
                      }
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </>
              )}

              <div className="book-ui__actions">
                <button className="book-ui__action-btn" type="button" onClick={() => addToList(book, 'reading')}>
                  Reading
                </button>
                <button className="book-ui__action-btn" type="button" onClick={() => addToList(book, 'hasRead')}>
                  Has Read
                </button>
                <button className="book-ui__action-btn" type="button" onClick={() => addToList(book, 'wantsToRead')}>
                  Want to Read
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(books.length > 0 || page > 0) && (
        <div className="book-ui__pagination">
          <button
            type="button"
            className="book-ui__page-btn"
            disabled={page === 0}
            onClick={() => runSearch(page - 1)}
          >
            Previous
          </button>

          <span className="book-ui__page-label">Page {page + 1}</span>

          <button
            type="button"
            className="book-ui__page-btn"
            disabled={books.length < maxResults}
            onClick={() => runSearch(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default BookUI;
