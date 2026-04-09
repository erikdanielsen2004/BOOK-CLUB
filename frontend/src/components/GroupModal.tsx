import { useState } from "react";
import "../styles/GroupModal.css";

// ── Types ─────
export interface GroupMember {
  id: string;
  name: string;
  initial: string;
}

export interface BookCandidate {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  coverColor: string;
}

export interface GroupModalData {
  id: string;
  name: string;
  description: string;
  owner: string;       // owner user id — compare to current user id to show owner controls
  members: GroupMember[];
  bookCandidates: BookCandidate[];
  votes: { userId: string; bookId: string }[];
  createdAt: string;
}

interface GroupModalProps {
  group: GroupModalData;
  currentUserId: string; // from JWT — to determine if user is owner
  onClose: () => void;
  onLeave: (groupId: string) => void;
  onSave: (updated: GroupModalData) => void;
}

type Tab = "info" | "books" | "vote";

// Tab Button
const TabBtn: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    className={`gmodal__tab ${active ? "gmodal__tab--active" : ""}`}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

//Group Modal
const GroupModal: React.FC<GroupModalProps> = ({
  group,
  currentUserId,
  onClose,
  onLeave,
  onSave,
}) => {
  const [activeTab,    setActiveTab]    = useState<Tab>("info");
  const [candidates,   setCandidates]   = useState<BookCandidate[]>(group.bookCandidates);
  const [votes,        setVotes]        = useState(group.votes);
  const [bookSearch,   setBookSearch]   = useState("");
  const [searchResults, setSearchResults] = useState<BookCandidate[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isOwner = group.owner === currentUserId;

  // current user's vote
  const myVote = votes.find((v) => v.userId === currentUserId)?.bookId ?? null;

  //
  const handleBookSearch = async () => {
    if (!bookSearch.trim()) return;
    setSearching(true);
    try {
      // BOOKS API



      setSearchResults([
        { id: "stub1", title: `"${bookSearch}" result`, author: "Connect Google Books API", coverUrl: null, coverColor: "#3a3a3a" },
      ]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddCandidate = (book: BookCandidate) => {
    if (candidates.find((c) => c.id === book.id)) return; // no duplicates
    setCandidates((prev) => [...prev, book]);
    setSearchResults([]);
    setBookSearch("");
  };

  const handleRemoveCandidate = (bookId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== bookId));
    setVotes((prev) => prev.filter((v) => v.bookId !== bookId));
  };

  const handleVote = (bookId: string) => {
    // Toggle — clicking same book removes vote
    if (myVote === bookId) {
      setVotes((prev) => prev.filter((v) => v.userId !== currentUserId));
    } else {
      setVotes((prev) => [
        ...prev.filter((v) => v.userId !== currentUserId),
        { userId: currentUserId, bookId },
      ]);
    }
  };

  const handleSave = () => {
    // API call to save updates

    onSave({ ...group, bookCandidates: candidates, votes });
    onClose();
  };

  const handleLeave = () => {
    //API call to leave group or delete if owner


    onLeave(group.id);
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // vote count per book
  const voteCount = (bookId: string) =>
    votes.filter((v) => v.bookId === bookId).length;

  return (
    <div className="gmodal-backdrop" onClick={handleBackdrop}>
      <div className="gmodal" role="dialog" aria-modal="true">
        <button className="gmodal__close" onClick={onClose} aria-label="Close">✕</button>

        {/* Header */}
        <div className="gmodal__header">
          <div>
            <h2 className="gmodal__name">{group.name}</h2>
            {group.description && (
              <p className="gmodal__desc">{group.description}</p>
            )}
          </div>
          <span className="gmodal__member-count">
            {group.members.length} members
          </span>
        </div>

        {/* Tabs */}
        <div className="gmodal__tabs">
          <TabBtn label="Info"         active={activeTab === "info"}  onClick={() => setActiveTab("info")}  />
          <TabBtn label="Book Candidates" active={activeTab === "books"} onClick={() => setActiveTab("books")} />
          <TabBtn label="Vote"         active={activeTab === "vote"}  onClick={() => setActiveTab("vote")}  />
        </div>

        {/* ── Tab: Info ── */}
        {activeTab === "info" && (
          <div className="gmodal__content">
            <p className="gmodal__section-label">Members</p>
            <div className="gmodal__members">
              {group.members.map((m) => (
                <div key={m.id} className="gmodal__member">
                  <div className="gmodal__member-avatar">{m.initial}</div>
                  <span className="gmodal__member-name">
                    {m.name}
                    {m.id === group.owner && (
                      <span className="gmodal__owner-badge"> Owner</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Leave group */}
            {!confirmLeave ? (
              <button
                className="gmodal__leave-btn"
                onClick={() => setConfirmLeave(true)}
              >
                {isOwner ? "Delete group" : "Leave group"}
              </button>
            ) : (
              <div className="gmodal__confirm">
                <p>Are you sure?</p>
                <div className="gmodal__confirm-actions">
                  <button className="gmodal__confirm-yes" onClick={handleLeave}>
                    Yes, {isOwner ? "delete" : "leave"}
                  </button>
                  <button className="gmodal__confirm-no" onClick={() => setConfirmLeave(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Book Candidates ── */}
        {activeTab === "books" && (
          <div className="gmodal__content">
            <p className="gmodal__section-label">Search & add a book candidate</p>

            <div className="gmodal__book-search">
              <input
                type="text"
                placeholder="Search for a book..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBookSearch()}
              />
              <button onClick={handleBookSearch} disabled={searching}>
                {searching ? "..." : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="gmodal__search-results">
                {searchResults.map((r) => (
                  <div
                    key={r.id}
                    className="gmodal__search-result"
                    onClick={() => handleAddCandidate(r)}
                  >
                    <div
                      className="gmodal__result-cover"
                      style={{ background: r.coverColor }}
                    >
                      {r.coverUrl && <img src={r.coverUrl} alt={r.title} />}
                    </div>
                    <div>
                      <p className="gmodal__result-title">{r.title}</p>
                      <p className="gmodal__result-author">{r.author}</p>
                    </div>
                    <span className="gmodal__result-add">+ Add</span>
                  </div>
                ))}
              </div>
            )}

            <p className="gmodal__section-label" style={{ marginTop: "1rem" }}>
              Current candidates
            </p>
            {candidates.length === 0 ? (
              <p className="gmodal__empty">No candidates yet. Add one above!</p>
            ) : (
              <div className="gmodal__candidates">
                {candidates.map((c) => (
                  <div key={c.id} className="gmodal__candidate">
                    <div
                      className="gmodal__candidate-cover"
                      style={{ background: c.coverColor }}
                    >
                      {c.coverUrl && <img src={c.coverUrl} alt={c.title} />}
                    </div>
                    <div className="gmodal__candidate-info">
                      <p className="gmodal__candidate-title">{c.title}</p>
                      <p className="gmodal__candidate-author">{c.author}</p>
                    </div>
                    <button
                      className="gmodal__candidate-remove"
                      onClick={() => handleRemoveCandidate(c.id)}
                      aria-label="Remove candidate"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Vote ── */}
        {activeTab === "vote" && (
          <div className="gmodal__content">
            <p className="gmodal__section-label">
              Cast your vote — click a book to vote, click again to remove
            </p>
            {candidates.length === 0 ? (
              <p className="gmodal__empty">No book candidates yet. Add some in the Book Candidates tab!</p>
            ) : (
              <div className="gmodal__vote-list">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className={`gmodal__vote-option ${myVote === c.id ? "gmodal__vote-option--voted" : ""}`}
                    onClick={() => handleVote(c.id)}
                  >
                    <div
                      className="gmodal__vote-cover"
                      style={{ background: c.coverColor }}
                    >
                      {c.coverUrl && <img src={c.coverUrl} alt={c.title} />}
                    </div>
                    <div className="gmodal__vote-info">
                      <p className="gmodal__vote-title">{c.title}</p>
                      <p className="gmodal__vote-author">{c.author}</p>
                    </div>
                    <div className="gmodal__vote-count">
                      <span className="gmodal__vote-number">{voteCount(c.id)}</span>
                      <span className="gmodal__vote-label">vote{voteCount(c.id) !== 1 ? "s" : ""}</span>
                    </div>
                    {myVote === c.id && (
                      <span className="gmodal__voted-badge">Voted</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="gmodal__actions">
          <button className="gmodal__btn gmodal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="gmodal__btn gmodal__btn--save"   onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;