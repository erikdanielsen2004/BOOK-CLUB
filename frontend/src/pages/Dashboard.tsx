import Sidebar from "../components/Sidebar.tsx";
import "../styles/Dashboard.css";

// types - replace
interface CurrentBook {
  title: string;
  author: string;
  chapter: number;
  progress: number; // 0-100
  coverUrl: string | null;
}

interface VoteBook {
  id: string;
  title: string;
  author: string;
  color: string; // placeholder color until Google Books API is wired up
}

// ── Placeholder
const CURRENT_BOOK: CurrentBook = {
  title: "Shadow Slave",
  author: "Guiltythree",
  chapter: 14,
  progress: 45,
  coverUrl: null,
};

//placeholder
const VOTE_BOOKS: VoteBook[] = [
  { id: "1", title: "Dune",                  author: "Frank Herbert",    color: "#e6a817" },
  { id: "2", title: "A Song of Ice and Fire", author: "George R.R. Martin", color: "#8b2323" },
];

// Currently Reading Card
const CurrentlyReading: React.FC<{ book: CurrentBook }> = ({ book }) => {
  return (
    <div className="currently-reading">
      {/* Book cover */}
      <div className="currently-reading__cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} />
        ) : (
          <div className="currently-reading__cover-placeholder">
            <span>{book.title}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="currently-reading__info">
        <p className="currently-reading__label">Continue reading</p>
        <h3 className="currently-reading__title">{book.title}</h3>
        <p className="currently-reading__meta">
          {book.author} - chapter {book.chapter}
        </p>

        {/* Progress bar */}
        <div className="currently-reading__progress-track">
          <div
            className="currently-reading__progress-fill"
            style={{ width: `${book.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// right panel
const RightPanel: React.FC = () => {
  // Get first initial from stored user - replace later
  const initial = "A";

  return (
    <aside className="dashboard-right">
      {/* Avatar */}
      <div className="dashboard-avatar">{initial}</div>

      {/* Books read stat */}
      <div className="stat-card">
        <p className="stat-card__label">Books read</p>
        <p className="stat-card__number">10</p> {/* Replace with actual number from backend once ready */  }
      </div>

      {/* Active vote card */}
      <div className="vote-card">
        <p className="vote-card__title">Active vote - Fantasy club</p>

        <div className="vote-card__options">
          {VOTE_BOOKS.map((book) => (
            <div key={book.id} className="vote-option">
              <div
                className="vote-option__swatch"
                style={{ background: book.color }}
              />
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

// dashboard page
const Dashboard: React.FC = () => {
  // Replace "User" with actual name from JWT / auth context once backend is ready
  const userName = "User";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        {/* Center content */}
        <div className="dashboard-center">
          <h1 className="dashboard-welcome">Welcome Back, {userName}</h1>

          <CurrentlyReading book={CURRENT_BOOK} />

          {/* Activity feed — empty for now */}
          <section className="activity">
            <h2 className="activity__heading">Activity</h2>
            <div className="activity__item activity__item--empty" />
            <div className="activity__item activity__item--empty" />
          </section>
        </div>

        {/* Right panel */}
        <RightPanel />
      </div>
    </div>
  );
};

export default Dashboard;