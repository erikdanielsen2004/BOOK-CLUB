import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import GroupModal, { type GroupModalData } from "../components/GroupModal.tsx";
import "../styles/MyGroups.css";

type StoredUser = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function makeInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

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
            initial: makeInitial(member.firstName || fullName),
          };
        })
      : [],
    currentBook: group.currentBook
      ? {
          id: group.currentBook._id,
          title: group.currentBook.title || "Untitled",
          author: Array.isArray(group.currentBook.authors) ? group.currentBook.authors.join(", ") : "",
          coverUrl: group.currentBook.thumbnail || null,
          coverColor: colorFromTitle(group.currentBook.title || "Book"),
          googleBooksId: group.currentBook.googleBooksId || "",
          description: "",
          categories: [],
          pageCount: 0,
          publishedDate: "",
          averageRating: 0,
          ratingsCount: 0,
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

const GroupCard: React.FC<{ group: GroupModalData; onClick: () => void }> = ({ group, onClick }) => {
  const currentBook = group.currentBook;

  return (
    <div className="group-card" onClick={onClick}>
      <div
        className="group-card__cover"
        style={{ background: currentBook?.coverColor ?? fallbackCover }}
      >
        {currentBook?.coverUrl && <img src={currentBook.coverUrl} alt={currentBook.title} />}
      </div>

      <div className="group-card__info">
        <h3 className="group-card__name">{group.name}</h3>
        <p className="group-card__members">{group.members.length} members</p>

        {currentBook ? (
          <p className="group-card__book">
            Currently reading:{" "}
            <span className="group-card__book-title">{currentBook.title}</span>
            {currentBook.author && (
              <span className="group-card__book-author"> — {currentBook.author}</span>
            )}
          </p>
        ) : group.voteSessionActive ? (
          <p className="group-card__book">
            Voting in progress for next book
          </p>
        ) : (
          <p className="group-card__book">No assigned book yet</p>
        )}
      </div>

      <button
        className="group-card__btn"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        View Group
      </button>
    </div>
  );
};

const MyGroups: React.FC = () => {
  const user = getStoredUser();
  const currentUserId = user?._id || "";

  const [groups, setGroups] = useState<GroupModalData[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupModalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchGroups = async (searchValue = "") => {
    if (!currentUserId) {
      setPageError("You must be logged in to view groups.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const query = new URLSearchParams();
      if (searchValue.trim()) query.set("searchBar", searchValue.trim());

      const res = await fetch(`/api/group-main/search/${currentUserId}?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load groups.");

      const mapped = Array.isArray(data.groups) ? data.groups.map(mapGroup) : [];
      setGroups(mapped);

      setSelectedGroup((prev) => {
        if (!prev) return null;
        return mapped.find((g) => g.id === prev.id) || null;
      });
    } catch (err: any) {
      setPageError(err.message || "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  }, [groups, search]);

  const handleSave = (updated: GroupModalData) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGroup(updated);
  };

  const handleLeave = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setSelectedGroup(null);
  };

  return (
    <div className="groups-layout">
      <Sidebar />

      <div className="groups-main">
        <div className="groups-header">
          <h1 className="groups-heading">Groups</h1>

          <div className="groups-search">
            <input
              type="text"
              placeholder="Search my groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="groups-search__icon">🔍</span>
          </div>
        </div>

        {pageError && <p className="groups-empty">{pageError}</p>}
        {loading && <p className="groups-empty">Loading groups...</p>}

        {!loading && !pageError && (
          <div className="groups-list">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => setSelectedGroup(group)}
                />
              ))
            ) : (
              <p className="groups-empty">No groups found.</p>
            )}
          </div>
        )}

        <button className="groups-join-btn" onClick={() => fetchGroups(search)}>
          Refresh groups
        </button>
      </div>

      {selectedGroup && currentUserId && (
        <GroupModal
          group={selectedGroup}
          currentUserId={currentUserId}
          onClose={() => setSelectedGroup(null)}
          onSave={handleSave}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
};

export default MyGroups;
