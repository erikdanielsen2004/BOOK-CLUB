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
  thumbnail?: string;
  pageCount?: number;
  averageRating?: number;
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

const mapApiBookToModal = (book: ApiBook): BookModalData => ({
  id: book.googleBooksId || book._id || crypto.randomUUID(),
  title: book.title,
  author: book.authors?.join(", ") || "Unknown",
  coverUrl: book.thumbnail || null,
  coverColor: "#8C2F39",
  status: "currently_reading",
  totalPages: book.pageCount || 0,
  rating: Math.round(book.averageRating || 0),
  review: ""
});

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

          {currentReading ? (
            <CurrentlyReadingCard
              book={currentReading}
              onClick={() => setSelected(currentReading)}
            />
          ) : (
            <p className="dashboard-empty">No books currently reading yet.</p>
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
