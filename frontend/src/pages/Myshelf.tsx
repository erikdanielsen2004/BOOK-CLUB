import { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/MyShelf.css";

// Types
type ShelfTab = "has_read" | "currently_reading" | "want_to_read";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  coverColor: string; // placeholder
}

//  Placeholder
const SHELF_DATA: Record<ShelfTab, Book[]> = {
  has_read: [
    { id: "1", title: "Shadow Slave",    author: "Guiltythree",       coverUrl: null, coverColor: "#6b0f6b" },
    { id: "2", title: "The Way of Kings", author: "Brandon Sanderson", coverUrl: null, coverColor: "#1a1a0a" },
  ],
  currently_reading: [
    { id: "3", title: "Dune",            author: "Frank Herbert",      coverUrl: null, coverColor: "#8b6914" },
  ],
  want_to_read: [
    { id: "4", title: "The Name of the Wind", author: "Patrick Rothfuss", coverUrl: null, coverColor: "#0a3d5c" },
    { id: "5", title: "Mistborn",        author: "Brandon Sanderson",  coverUrl: null, coverColor: "#2d4a1e" },
    { id: "6", title: "Circe",           author: "Madeline Miller",    coverUrl: null, coverColor: "#5c1a3a" },
  ],
};

// stat card
interface StatCardProps {
  count: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ count, label }) => (
  <div className="shelf-stat">
    <span className="shelf-stat__number">{count}</span>
    <span className="shelf-stat__label">{label}</span>
  </div>
);

// Book Card
const BookCard: React.FC<{ book: Book }> = ({ book }) => (
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
    </div>
  </div>
);

// My Shelf Page
const MyShelf: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ShelfTab>("currently_reading");
  const [search, setSearch] = useState("");

  const tabs: { key: ShelfTab; label: string }[] = [
    { key: "has_read",          label: "Has read" },
    { key: "currently_reading", label: "Currently reading" },
    { key: "want_to_read",      label: "Want to read" },
  ];

  const filteredBooks = SHELF_DATA[activeTab].filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="shelf-layout">
      <Sidebar />

      <div className="shelf-main">
        <h1 className="shelf-heading">My Shelf</h1>

        {/* Stat cards */}
        <div className="shelf-stats">
          <StatCard count={SHELF_DATA.has_read.length}          label="Books read" />
          <StatCard count={SHELF_DATA.currently_reading.length} label="Currently reading" />
          <StatCard count={SHELF_DATA.want_to_read.length}      label="Want to read" />
        </div>

        {/* Tabs */}
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

        {/* Search */}
        <div className="shelf-search">
          <input
            type="text"
            placeholder="Search your shelf"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="shelf-search__icon">🔍</span>
        </div>

        {/* Book grid */}
        <div className="shelf-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
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