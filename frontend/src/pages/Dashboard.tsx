import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.tsx";
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

const CurrentlyReadingCard: React.FC<{ book: ApiBook }> = ({ book }) => {
  return (
    <div className="currently-reading">
      <div className="currently-reading__cover">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt={book.title} />
        ) : (
          <div className="currently-reading__cover-placeholder" />
        )}
      </div>

      <div className="currently-reading__info">
        <p className="currently-reading__label">Continue reading</p>
        <h3 className="currently-reading__title">{book.title}</h3>
        <p className="currently-reading__meta">{book.authors?.join(", ") || "Unknown"}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);
  const userName = user?.firstName || "User";
  const initial = user?.firstName?.[0]?.toUpperCase() || "U";

  const [hasRead, setHasRead] = useState<ApiBook[]>([]);
  const [readingBooks, setReadingBooks] = useState<ApiBook[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-center">
          <h1 className="dashboard-welcome">Welcome Back, {userName}</h1>

          {readingBooks.length > 0 ? (
            readingBooks.map((book) => (
              <CurrentlyReadingCard
                key={book._id || book.googleBooksId || book.title}
                book={book}
              />
            ))
          ) : (
            <p className="dashboard-empty">No books currently reading yet.</p>
          )}
        </div>

        <aside className="dashboard-right">
          <div className="dashboard-user-menu" ref={menuRef}>
            <button
              type="button"
              className="dashboard-avatar dashboard-avatar--button"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {initial}
            </button>

            {menuOpen && (
              <div className="dashboard-avatar-menu">
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>

          <div className="stat-card">
            <p className="stat-card__label">Books read</p>
            <p className="stat-card__number">{hasRead.length}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
