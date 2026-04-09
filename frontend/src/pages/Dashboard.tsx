import { useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import BookModal, { type BookModalData } from "../components/BookModal.tsx";
import "../styles/Dashboard.css";

// ── PLACE HOLDER
const INITIAL_READING: BookModalData[] = [
  {
    id: "3",
    title: "Dune",
    author: "Frank Herbert",
    coverUrl: null,
    coverColor: "#8b6914",
    status: "currently_reading",
    totalPages: 412,
    rating: 0,
    review: "",
  },
];

// search
interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  totalPages: number | null;
}

//search bar
const BookSearch: React.FC<{ onSelect: (book: SearchResult) => void }> = ({ onSelect }) => {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      // todo : connect books api
      // Placeholder until API is connected
      setResults([
        {
          id: "s1",
          title: `Results for "${query}"`,
          author: "frankie",
          coverUrl: null,
          totalPages: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-search">
      <div className="book-search__bar">
        <input
          type="text"
          placeholder="Search for a book..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "..." : "search"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="book-search__results">
          {results.map((r) => (
            <div
              key={r.id}
              className="book-search__result"
              onClick={() => { onSelect(r); setResults([]); setQuery(""); }}
            >
              <div className="book-search__result-cover">
                {r.coverUrl
                  ? <img src={r.coverUrl} alt={r.title} />
                  : <div className="book-search__result-placeholder" />
                }
              </div>
              <div>
                <p className="book-search__result-title">{r.title}</p>
                <p className="book-search__result-author">{r.author}</p>
                {r.totalPages && (
                  <p className="book-search__result-pages">{r.totalPages} pages</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// currently reading card
const CurrentlyReadingCard: React.FC<{
  book: BookModalData;
  onClick: () => void;
}> = ({ book, onClick }) => {

  return (
    <div className="currently-reading" onClick={onClick}>
      <div className="currently-reading__cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} />
        ) : (
          <div
            className="currently-reading__cover-placeholder"
            style={{ background: book.coverColor }}
          />
        )}
      </div>
      <div className="currently-reading__info">
        <p className="currently-reading__label">Continue reading</p>
        <h3 className="currently-reading__title">{book.title}</h3>
        <p className="currently-reading__meta">
          {book.author}
        </p>
      </div>
    </div>
  );
};

// righ panel
const RightPanel: React.FC<{ booksRead: number }> = ({ booksRead }) => {
  const initial = "A"; // replace with user initial PLACEHOLDER

  const VOTE_BOOKS = [
    { id: "1", title: "Dune",                  author: "Frank Herbert",      color: "#e6a817" },
    { id: "2", title: "A Song of Ice and Fire", author: "George R.R. Martin", color: "#8C2F39" },
  ];

  return (
    <aside className="dashboard-right">
      <div className="dashboard-avatar">{initial}</div>

      <div className="stat-card">
        <p className="stat-card__label">Books read</p>
        <p className="stat-card__number">{booksRead}</p>
      </div>

      <div className="vote-card">
        <p className="vote-card__title">Active vote - Fantasy club</p>
        <div className="vote-card__options">
          {VOTE_BOOKS.map((book) => (
            <div key={book.id} className="vote-option">
              <div className="vote-option__swatch" style={{ background: book.color }} />
              <div className="vote-option__info">
                <p className="vote-option__title">{book.title}</p>
                <p className="vote-option__author">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="vote-card__btn">Cast your vote</button>
      </div>
    </aside>
  );
};

// main dashboard page
const Dashboard: React.FC = () => {
  const userName = "User"; // replace PLACEHOLDER

  const [readingBooks, setReadingBooks] = useState<BookModalData[]>(INITIAL_READING);
  const [selectedBook, setSelected]     = useState<BookModalData | null>(null);

  const handleSearchSelect = (result: SearchResult) => {
    const newBook: BookModalData = {
      id: result.id,
      title: result.title,
      author: result.author,
      coverUrl: result.coverUrl,
      coverColor: "#3a3a3a",
      status: "want_to_read",
      rating: 0,
      review: "",
      totalPages: result.totalPages ?? 0, // APIb
    };
    setSelected(newBook);
  };

  const handleSave = (updated: BookModalData) => {
    setReadingBooks((prev) => {
      const exists = prev.find((b) => b.id === updated.id);
      if (updated.status === "currently_reading") {
        return exists
          ? prev.map((b) => (b.id === updated.id ? updated : b))
          : [...prev, updated];
      }
      return prev.filter((b) => b.id !== updated.id);
    });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-center">
          <h1 className="dashboard-welcome">Welcome Back, {userName}</h1>

          <BookSearch onSelect={handleSearchSelect} />

          {readingBooks.length > 0 ? (
            readingBooks.map((book) => (
              <CurrentlyReadingCard
                key={book.id}
                book={book}
                onClick={() => setSelected(book)}
              />
            ))
          ) : (
            <p className="dashboard-empty">
              No books currently reading. Search for one above!
            </p>
          )}
        </div>

        <RightPanel booksRead={10} />
      </div>

      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Dashboard;
