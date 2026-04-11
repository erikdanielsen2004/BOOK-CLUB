import { useEffect, useMemo, useState } from "react";
import "../styles/GroupModal.css";

export interface GroupMember {
  id: string;
  name: string;
  initial: string;
}

export interface BookCandidate {
  id: string;
  googleBooksId?: string;
  title: string;
  author: string;
  coverUrl: string | null;
  coverColor: string;
  description?: string;
  categories?: string[];
  pageCount?: number;
  publishedDate?: string;
  averageRating?: number;
  ratingsCount?: number;
}

export interface GroupVote {
  id?: string;
  userId: string;
  bookId: string;
}

export interface GroupModalData {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: GroupMember[];
  currentBook: BookCandidate | null;
  bookCandidates: BookCandidate[];
  votes: GroupVote[];
  voteSessionActive: boolean;
  voteStartAt: string | null;
  voteEndAt: string | null;
  createdAt: string;
}

interface GroupModalProps {
  group: GroupModalData;
  currentUserId: string;
  onClose: () => void;
  onLeave: (groupId: string) => void;
  onSave: (updated: GroupModalData) => void;
}

type Tab = "info" | "books" | "vote";

function colorFromTitle(title: string) {
  const colors = ["#8C2F39", "#7A5C61", "#B08968", "#6D597A", "#355070", "#588157"];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash += title.charCodeAt(i);
  return colors[hash % colors.length];
}

function mapGroup(group: any): GroupModalData {
  return {
    id: group._id,
    name: group.name || "Untitled Group",
    description: group.description || "",
    owner: typeof group.owner === "string" ? group.owner : group.owner?._id || "",
    members: Array.isArray(group.members)
      ? group.members.map((member: any) => {
          const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unknown User";
          return {
            id: member._id,
            name: fullName,
            initial: (member.firstName || fullName).trim().charAt(0).toUpperCase() || "?",
          };
        })
      : [],
    currentBook: group.currentBook
      ? {
          id: group.currentBook._id,
          googleBooksId: group.currentBook.googleBooksId || "",
          title: group.currentBook.title || "Untitled",
          author: Array.isArray(group.currentBook.authors) ? group.currentBook.authors.join(", ") : "",
          coverUrl: group.currentBook.thumbnail || null,
          coverColor: colorFromTitle(group.currentBook.title || "Book"),
        }
      : null,
    bookCandidates: Array.isArray(group.bookCandidates)
      ? group.bookCandidates.map((book: any) => ({
          id: book._id,
          googleBooksId: book.googleBooksId || "",
          title: book.title || "Untitled",
          author: Array.isArray(book.authors) ? book.authors.join(", ") : "",
          coverUrl: book.thumbnail || null,
          coverColor: colorFromTitle(book.title || "Book"),
          description: book.description || "",
          categories: Array.isArray(book.categories) ? book.categories : [],
          pageCount: book.pageCount || 0,
          publishedDate: book.publishedDate || "",
          averageRating: book.averageRating || 0,
          ratingsCount: book.ratingsCount || 0,
        }))
      : [],
    votes: Array.isArray(group.votes)
      ? group.votes.map((vote: any) => ({
          id: vote._id,
          userId: typeof vote.user === "string" ? vote.user : vote.user?._id || "",
          bookId: typeof vote.book === "string" ? vote.book : vote.book?._id || "",
        }))
      : [],
    voteSessionActive: !!group.voteSessionActive,
    voteStartAt: group.voteStartAt || null,
    voteEndAt: group.voteEndAt || null,
    createdAt: group.createdAt,
  };
}

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

const GroupModal: React.FC<GroupModalProps> = ({
  group,
  currentUserId,
  onClose,
  onLeave,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [groupState, setGroupState] = useState<GroupModalData>(group);
  const [bookSearch, setBookSearch] = useState("");
  const [searchResults, setSearchResults] = useState<BookCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [durationDays, setDurationDays] = useState(3);
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description);

  useEffect(() => {
    setGroupState(group);
    setEditName(group.name);
    setEditDescription(group.description);
  }, [group]);

  const isOwner = groupState.owner === currentUserId;
  const isMember = groupState.members.some((m) => m.id === currentUserId);

  const myVote = groupState.votes.find((v) => v.userId === currentUserId)?.bookId ?? null;

  const voteExpired = useMemo(() => {
    if (!groupState.voteEndAt) return false;
    return new Date(groupState.voteEndAt).getTime() <= Date.now();
  }, [groupState.voteEndAt]);

  const canVote = isMember && groupState.voteSessionActive && !voteExpired;

  const voteCount = (bookId: string) =>
    groupState.votes.filter((v) => v.bookId === bookId).length;

  const updateLocalAndParent = (updated: GroupModalData) => {
    setGroupState(updated);
    onSave(updated);
  };

  const handleEditGroup = async () => {
    if (!isOwner) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-main/edit/${currentUserId}/${groupState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update group.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setMessage("Group updated successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to update group.");
    } finally {
      setWorking(false);
    }
  };

  const handleBookSearch = async () => {
    if (!bookSearch.trim()) return;

    try {
      setSearching(true);
      setMessage("");

      const query = new URLSearchParams({
        q: bookSearch.trim(),
        maxResults: "10",
      });

      const res = await fetch(`/api/search/books?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Search failed.");

      const results: BookCandidate[] = Array.isArray(data.books)
        ? data.books.map((book: any) => ({
            id: book.googleBooksId,
            googleBooksId: book.googleBooksId,
            title: book.title || "Untitled",
            author: Array.isArray(book.authors) ? book.authors.join(", ") : "",
            coverUrl: book.thumbnail || null,
            coverColor: colorFromTitle(book.title || "Book"),
            description: book.description || "",
            categories: Array.isArray(book.categories) ? book.categories : [],
            pageCount: book.pageCount || 0,
            publishedDate: book.publishedDate || "",
            averageRating: book.averageRating || 0,
            ratingsCount: book.ratingsCount || 0,
          }))
        : [];

      setSearchResults(results);
    } catch (err: any) {
      setMessage(err.message || "Failed to search books.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddCandidate = async (book: BookCandidate) => {
    if (!isOwner) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-owner/add-to-list/${currentUserId}/${groupState.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleBooksId: book.googleBooksId,
          title: book.title,
          authors: book.author ? book.author.split(", ").filter(Boolean) : [],
          description: book.description || "",
          categories: book.categories || [],
          thumbnail: book.coverUrl || "",
          pageCount: book.pageCount || 0,
          publishedDate: book.publishedDate || "",
          averageRating: book.averageRating || 0,
          ratingsCount: book.ratingsCount || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add book.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setSearchResults([]);
      setBookSearch("");
      setMessage("Book added successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to add book.");
    } finally {
      setWorking(false);
    }
  };

  const handleRemoveCandidate = async (bookId: string) => {
    if (!isOwner) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-owner/remove-from-list/${currentUserId}/${groupState.id}/${bookId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove book.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setMessage("Book removed.");
    } catch (err: any) {
      setMessage(err.message || "Failed to remove book.");
    } finally {
      setWorking(false);
    }
  };

  const handlePublishList = async () => {
    if (!isOwner) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-owner/${currentUserId}/${groupState.id}/publish-list`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish list.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setMessage("List published successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to publish list.");
    } finally {
      setWorking(false);
    }
  };

  const handleStartVote = async () => {
    if (!isOwner) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-owner/start-vote/${currentUserId}/${groupState.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start vote.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setActiveTab("vote");
      setMessage("Vote started.");
    } catch (err: any) {
      setMessage(err.message || "Failed to start vote.");
    } finally {
      setWorking(false);
    }
  };

  const handleVote = async (bookId: string) => {
    if (!canVote) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-voting/cast-vote/${currentUserId}/${groupState.id}/${bookId}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cast vote.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setMessage("Vote saved.");
    } catch (err: any) {
      setMessage(err.message || "Failed to cast vote.");
    } finally {
      setWorking(false);
    }
  };

  const handleEndVote = async () => {
    if (!isOwner) return;

    try {
      setWorking(true);
      setMessage("");

      const res = await fetch(`/api/group-voting/vote-ended/${currentUserId}/${groupState.id}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to end vote.");

      const updated = mapGroup(data.group);
      updateLocalAndParent(updated);
      setMessage(data.message || "Vote ended.");
    } catch (err: any) {
      setMessage(err.message || "Failed to end vote.");
    } finally {
      setWorking(false);
    }
  };

  const handleLeave = async () => {
    try {
      setWorking(true);
      setMessage("");

      const endpoint = isOwner
        ? `/api/group-main/delete/${currentUserId}/${groupState.id}`
        : `/api/group-main/leave/${currentUserId}/${groupState.id}`;

      const res = await fetch(endpoint, {
        method: isOwner ? "DELETE" : "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to leave group.");

      onLeave(groupState.id);
      onClose();
    } catch (err: any) {
      setMessage(err.message || "Failed to leave group.");
    } finally {
      setWorking(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const voteStatusText = useMemo(() => {
    if (!groupState.voteSessionActive || !groupState.voteEndAt) return "No active vote";
    if (voteExpired) return "Vote expired";
    return `Voting ends ${new Date(groupState.voteEndAt).toLocaleString()}`;
  }, [groupState.voteSessionActive, groupState.voteEndAt, voteExpired]);

  return (
    <div className="gmodal-backdrop" onClick={handleBackdrop}>
      <div className="gmodal" role="dialog" aria-modal="true">
        <button className="gmodal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="gmodal__header">
          <div>
            <h2 className="gmodal__name">{groupState.name}</h2>
            {groupState.description && <p className="gmodal__desc">{groupState.description}</p>}
            <p className="gmodal__desc gmodal__desc--status">{voteStatusText}</p>
          </div>

          <div className="gmodal__header-side">
            <span className="gmodal__member-count">{groupState.members.length} members</span>
            {isOwner && <span className="gmodal__header-badge">You own this group</span>}
          </div>
        </div>

        <div className="gmodal__tabs">
          <TabBtn label="Info" active={activeTab === "info"} onClick={() => setActiveTab("info")} />
          <TabBtn label="Books" active={activeTab === "books"} onClick={() => setActiveTab("books")} />
          <TabBtn label="Vote" active={activeTab === "vote"} onClick={() => setActiveTab("vote")} />
        </div>

        {message && <p className="gmodal__message">{message}</p>}

        {activeTab === "info" && (
          <div className="gmodal__content">
            {groupState.currentBook && (
              <div className="gmodal__block">
                <p className="gmodal__section-label">Assigned book</p>
                <div className="gmodal__book-card">
                  <div
                    className="gmodal__candidate-cover"
                    style={{ background: groupState.currentBook.coverColor }}
                  >
                    {groupState.currentBook.coverUrl && (
                      <img src={groupState.currentBook.coverUrl} alt={groupState.currentBook.title} />
                    )}
                  </div>
                  <div className="gmodal__candidate-info">
                    <p className="gmodal__candidate-title">{groupState.currentBook.title}</p>
                    <p className="gmodal__candidate-author">{groupState.currentBook.author}</p>
                  </div>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="gmodal__block">
                <p className="gmodal__section-label">Edit group</p>
                <div className="gmodal__form-grid">
                  <label className="gmodal__field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>

                  <label className="gmodal__field">
                    <span>Description</span>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                    />
                  </label>

                  <button className="gmodal__btn gmodal__btn--save gmodal__btn--fit" onClick={handleEditGroup} disabled={working}>
                    Save group info
                  </button>
                </div>
              </div>
            )}

            <div className="gmodal__block">
              <p className="gmodal__section-label">Members</p>
              <div className="gmodal__members">
                {groupState.members.map((m) => (
                  <div key={m.id} className="gmodal__member">
                    <div className="gmodal__member-avatar">{m.initial}</div>
                    <span className="gmodal__member-name">
                      {m.name}
                      {m.id === groupState.owner && (
                        <span className="gmodal__owner-badge"> Owner</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="gmodal__block">
              <p className="gmodal__section-label">Membership</p>

              {!confirmLeave ? (
                <button
                  className="gmodal__leave-btn"
                  onClick={() => setConfirmLeave(true)}
                  disabled={working}
                >
                  {isOwner ? "Delete group" : "Leave group"}
                </button>
              ) : (
                <div className="gmodal__confirm">
                  <p>Are you sure?</p>
                  <div className="gmodal__confirm-actions">
                    <button className="gmodal__confirm-yes" onClick={handleLeave} disabled={working}>
                      Yes, {isOwner ? "delete" : "leave"}
                    </button>
                    <button className="gmodal__confirm-no" onClick={() => setConfirmLeave(false)} disabled={working}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "books" && (
          <div className="gmodal__content">
            {isOwner ? (
              <>
                <div className="gmodal__block">
                  <p className="gmodal__section-label">Search books to add</p>
                  <div className="gmodal__book-search">
                    <input
                      type="text"
                      placeholder="Search for a book..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBookSearch()}
                    />
                    <button onClick={handleBookSearch} disabled={searching || working}>
                      {searching ? "..." : "Search"}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="gmodal__search-results">
                      {searchResults.map((r) => (
                        <div
                          key={`${r.googleBooksId || r.id}`}
                          className="gmodal__search-result"
                          onClick={() => handleAddCandidate(r)}
                        >
                          <div className="gmodal__result-cover" style={{ background: r.coverColor }}>
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
                </div>

                <div className="gmodal__block">
                  <p className="gmodal__section-label">Owner actions</p>
                  <div className="gmodal__inline-actions">
                    <button className="gmodal__btn gmodal__btn--save" onClick={handlePublishList} disabled={working}>
                      Publish list
                    </button>

                    <select
                      className="gmodal__select"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      disabled={working}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <option key={day} value={day}>
                          {day} day{day !== 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>

                    <button className="gmodal__btn gmodal__btn--save" onClick={handleStartVote} disabled={working}>
                      Start vote
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="gmodal__empty">Only the owner can change group books.</p>
            )}

            <div className="gmodal__block">
              <p className="gmodal__section-label">Current candidates</p>

              {groupState.bookCandidates.length === 0 ? (
                <p className="gmodal__empty">No candidates yet.</p>
              ) : (
                <div className="gmodal__candidates">
                  {groupState.bookCandidates.map((c) => (
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

                      {isOwner && !groupState.voteSessionActive && (
                        <button
                          className="gmodal__candidate-remove"
                          onClick={() => handleRemoveCandidate(c.id)}
                          aria-label="Remove candidate"
                          disabled={working}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "vote" && (
          <div className="gmodal__content">
            <div className="gmodal__block">
              <p className="gmodal__section-label">
                {canVote
                  ? "Click a book to cast or replace your vote"
                  : groupState.voteSessionActive && voteExpired
                  ? "Voting has expired. The owner can end the vote now."
                  : "There is no active vote right now"}
              </p>

              {groupState.bookCandidates.length === 0 ? (
                <p className="gmodal__empty">No candidate books yet.</p>
              ) : (
                <div className="gmodal__vote-list">
                  {groupState.bookCandidates.map((c) => (
                    <div
                      key={c.id}
                      className={`gmodal__vote-option ${myVote === c.id ? "gmodal__vote-option--voted" : ""}`}
                      onClick={() => canVote && handleVote(c.id)}
                      style={{ cursor: canVote ? "pointer" : "default" }}
                    >
                      <div className="gmodal__vote-cover" style={{ background: c.coverColor }}>
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

                      {myVote === c.id && <span className="gmodal__voted-badge">Voted</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isOwner && groupState.voteSessionActive && (
              <div className="gmodal__block">
                <p className="gmodal__section-label">Owner vote controls</p>
                <button className="gmodal__btn gmodal__btn--save gmodal__btn--fit" onClick={handleEndVote} disabled={working}>
                  End vote now
                </button>
              </div>
            )}
          </div>
        )}

        <div className="gmodal__actions">
          <button className="gmodal__btn gmodal__btn--cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
