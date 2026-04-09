import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import BookModal, { type BookModalData } from "../components/BookModal.tsx";
import "../styles/Dashboard.css";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type ApiBook = {
  _id?: string;
  googleBooksId?: string;
  title: string;
  authors?: string[];
  description?: string;
  categories?: string[];
  thumbnail?: string;
  pageCount?: number;
  publishedDate?: string;
  averageRating?: number;
  ratingsCount?: number;
};

interface SearchResult {
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
}

const getStoredUser = (): UserData | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const mapApiBookToModal = (book: ApiBook): BookModalData => ({
  id: book._id || book.googleBooksId || crypto.randomUUID(),
  title: book.title,
  author: book.authors?.join(", ") || "Unknown",
  coverUrl: book.thumbnail || null,
  coverColor: "#8C2F39",
  status: "currently_reading",
  totalPages: book.pageCount || 0,
  rating: Math.round(book.averageRating || 0),
  review: ""
});

const BookSearch: React.FC<{ onSelect: (book: SearchResult) => void }> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/search/books?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setResults([]);
        return;
      }

      setResults(data.books || []);
    } catch {
      setResults([]);
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
              key={r.googleBooksId}
              className="book-search__result"
              onClick={() => {
                onSelect(r);
                setResults([]);
                setQuery("");
              }}
            >
              <div className="book-search__result-cover">
                {r.thumbnail
                  ? <img src={r.thumbnail} alt={r.title} />
                  : <div className="book-search__result-placeholder" />
                }
              </div>
              <div>
                <p className="book-search__result-title">{r.title}</p>
                <p className="book-search__result-author">{r.authors?.length ? r.authors.join(", ") : "Unknown"}</p>
                {r.pageCount ? (
                  <p className="book-search__result-pages">{r.pageCount} pages</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
        <p className="currently-reading__meta">{book.author}</p>
      </div>
    </div>
  );
};

const RightPanel: React.FC<{ booksRead: number; initial: string }> = ({ booksRead, initial }) => {
  return (
    <aside className="dashboard-right">
      <div className="dashboard-avatar">{initial}</div>

      <div className="stat-card">
        <p className="stat-card__label">Books read</p>
        <p className="stat-card__number">{booksRead}</p>
      </div>
    </aside>
  );
};

const Dashboard: React.FC = () => {
  const user = useMemo(() => getStoredUser(), []);
  const userName = user?.firstName || "User";
  const initial = user?.firstName?.[0]?.toUpperCase() || "U";

  const [hasRead, setHasRead] = useState<ApiBook[]>([]);
  const [readingBooks, setReadingBooks] = useState<ApiBook[]>([]);
  const [selectedBook, setSelected] = useState<BookModalData | null>(null);

  const fetchShelf = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/user-books/${user.id}`);
      const data = await res.json();

      if (!res.ok) return;

      setHasRead(data.hasRead || []);
      setReadingBooks(data.reading || []);
    } catch {}
  };

  useEffect(() => {
    fetchShelf();
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    setSelected({
      id: result.googleBooksId,
      title: result.title,
      author: result.authors?.join(", ") || "Unknown",
      coverUrl: result.thumbnail || null,
      coverColor: "#8C2F39",
      status: "currently_reading",
      rating: Math.round(result.averageRating || 0),
      review: "",
      totalPages: result.pageCount || 0
    });
  };

  const handleSave = async (updated: BookModalData) => {
    if (!user?.id) return;

    const targetList =
      updated.status === "currently_reading"
        ? "reading"
        : updated.status === "has_read"
        ? "hasRead"
        : "wantsToRead";

    const body = {
      googleBooksId: updated.id,
      title: updated.title,
      authors: updated.author ? updated.author.split(",").map(a => a.trim()) : [],
      description: "",
      categories: [],
      thumbnail: updated.coverUrl || "",
      pageCount: updated.totalPages || 0,
      publishedDate: "",
      averageRating: updated.rating || 0,
      ratingsCount: 0
    };

    try {
      await fetch(`/api/user-books/${user.id}/${targetList}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      await fetchShelf();
      setSelected(null);
    } catch {}
  };

  const currentReading = readingBooks[0] ? mapApiBookToModal(readingBooks[0]) : null;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-center">
          <h1 className="dashboard-welcome">Welcome Back, {userName}</h1>

          <BookSearch onSelect={handleSearchSelect} />

          {currentReading ? (
            <CurrentlyReadingCard
              book={currentReading}
              onClick={() => setSelected(currentReading)}
            />
          ) : (
            <p className="dashboard-empty">No books currently reading. Search for one above.</p>
          )}
        </div>

        <RightPanel booksRead={hasRead.length} initial={initial} />
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
