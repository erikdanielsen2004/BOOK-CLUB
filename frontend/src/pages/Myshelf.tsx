import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import "../styles/MyShelf.css";

type ShelfTab = "has_read" | "currently_reading" | "want_to_read";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type ApiBook = {
  _id: string;
  title: string;
  authors?: string[];
  thumbnail?: string;
};

const getStoredUser = (): UserData | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  coverColor: string;
}

const StatCard: React.FC<{ count: number; label: string }> = ({ count, label }) => (
  <div className="shelf-stat">
    <span className="shelf-stat__number">{count}</span>
    <span className="shelf-stat__label">{label}</span>
  </div>
);

const BookCard: React.FC<{
  book: Book;
  onMove: (target: "hasRead" | "reading" | "wantsToRead") => void;
  onRemove: () => void;
}> = ({ book, onMove, onRemove }) => (
  <div className="shelf-book">
    <div className="shelf-book__cover">
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={book.title} />
      ) : (
        <div
          className="shelf-book__cover-placeholder"
          style={{ background: book.coverColor }}
        />
      )}
    </div>

    <div className="shelf-book__info">
      <p className="shelf-book__title">{book.title}</p>
      <p className="shelf-book__author">{book.author}</p>

      <div className="shelf-book__actions">
        <button type="button" className="shelf-book__btn" onClick={() => onMove("hasRead")}>
          Has read
        </button>
        <button type="button" className="shelf-book__btn" onClick={() => onMove("reading")}>
          Reading
        </button>
        <button type="button" className="shelf-book__btn" onClick={() => onMove("wantsToRead")}>
          Want to read
        </button>
        <button type="button" className="shelf-book__btn shelf-book__btn--danger" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  </div>
);

const mapBook = (book: ApiBook, idx: number): Book => {
  const colors = ["#0a3d5c", "#2d4a1e", "#5c1a3a", "#8C2F39", "#8b6914"];
  return {
    id: book._id,
    title: book.title,
    author: book.authors?.join(", ") || "Unknown",
    coverUrl: book.thumbnail || null,
    coverColor: colors[idx % colors.length]
  };
};

const MyShelf: React.FC = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [activeTab, setActiveTab] = useState<ShelfTab>("currently_reading");
  const [search, setSearch] = useState("");

  const [hasRead, setHasRead] = useState<Book[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<Book[]>([]);
  const [wantToRead, setWantToRead] = useState<Book[]>([]);

  const fetchShelf = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/user-books/${user.id}`);
      const data = await res.json();

      if (!res.ok) return;

      setHasRead((data.hasRead || []).map(mapBook));
      setCurrentlyReading((data.reading || []).map(mapBook));
      setWantToRead((data.wantsToRead || []).map(mapBook));
    } catch {}
  };

  useEffect(() => {
    fetchShelf();
  }, []);

  const tabs: { key: ShelfTab; label: string }[] = [
    { key: "has_read", label: "Has read" },
    { key: "currently_reading", label: "Currently reading" },
    { key: "want_to_read", label: "Want to read" }
  ];

  const shelfData: Record<ShelfTab, Book[]> = {
    has_read: hasRead,
    currently_reading: currentlyReading,
    want_to_read: wantToRead
  };

  const filteredBooks = shelfData[activeTab].filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  const moveBook = async (bookId: string, target: "hasRead" | "reading" | "wantsToRead") => {
    if (!user?.id) return;

    try {
      await fetch(`/api/user-books/${user.id}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: target, bookId })
      });

      await fetchShelf();
    } catch {}
  };

  const removeBook = async (bookId: string) => {
    if (!user?.id) return;

    const listMap: Record<ShelfTab, string> = {
      has_read: "hasRead",
      currently_reading: "reading",
      want_to_read: "wantsToRead"
    };

    try {
      await fetch(`/api/user-books/${user.id}/${listMap[activeTab]}/${bookId}`, {
        method: "DELETE"
      });

      await fetchShelf();
    } catch {}
  };

  return (
    <div className="shelf-layout">
      <Sidebar />

      <div className="shelf-main">
        <h1 className="shelf-heading">My Shelf</h1>

        <div className="shelf-stats">
          <StatCard count={hasRead.length} label="Books read" />
          <StatCard count={currentlyReading.length} label="Currently reading" />
          <StatCard count={wantToRead.length} label="Want to read" />
        </div>

        <div className="shelf-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`shelf-tab ${activeTab === tab.key ? "shelf-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="shelf-search">
          <input
            type="text"
            placeholder="Search your shelf"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="shelf-search__icon">🔍</span>
        </div>

        <div className="shelf-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onMove={(target) => moveBook(book.id, target)}
                onRemove={() => removeBook(book.id)}
              />
            ))
          ) : (
            <p className="shelf-empty">No books found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyShelf;
