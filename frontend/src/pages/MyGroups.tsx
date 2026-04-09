import { useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import GroupModal, { type GroupModalData } from "../components/GroupModal.tsx";
import "../styles/MyGroups.css";

// ── PLACEHOLDER
const INITIAL_GROUPS: GroupModalData[] = [
  {
    id: "1",
    name: "Fantasy Club",
    description: "We read fantasy books and argue about them.",
    owner: "user_001",
    members: [
      { id: "user_001", name: "Ailed",   initial: "A" },
      { id: "user_002", name: "Brandon", initial: "B" },
      { id: "user_003", name: "Carlos",  initial: "C" },
    ],
    bookCandidates: [
      { id: "b1", title: "Dune",                  author: "Frank Herbert",       coverUrl: null, coverColor: "#e6a817" },
      { id: "b2", title: "A Song of Ice and Fire", author: "George R.R. Martin", coverUrl: null, coverColor: "#8C2F39" },
    ],
    votes: [{ userId: "user_002", bookId: "b1" }],
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Sci-Fi Readers",
    description: "",
    owner: "user_002",
    members: [
      { id: "user_001", name: "Ailed",   initial: "A" },
      { id: "user_002", name: "Brandon", initial: "B" },
    ],
    bookCandidates: [],
    votes: [],
    createdAt: "2026-02-20T00:00:00.000Z",
  },
];

// PLACEHOLDER
const CURRENT_USER_ID = "user_001";

// GROUP CARD
const GroupCard: React.FC<{ group: GroupModalData; onClick: () => void }> = ({ group, onClick }) => {
  const currentBook = group.bookCandidates[0] ?? null;

  return (
    <div className="group-card" onClick={onClick}>
      <div
        className="group-card__cover"
        style={{ background: currentBook?.coverColor ?? "#c4b9ae" }}
      >
        {currentBook?.coverUrl && <img src={currentBook.coverUrl} alt={currentBook.title} />}
      </div>

      <div className="group-card__info">
        <h3 className="group-card__name">{group.name}</h3>
        <p className="group-card__members">{group.members.length} members</p>
        {currentBook && (
          <p className="group-card__book">
            Currently reading:{" "}
            <span className="group-card__book-title">{currentBook.title}</span>
            <span className="group-card__book-author"> — {currentBook.author}</span>
          </p>
        )}
      </div>

      <button
        className="group-card__btn"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        View Group
      </button>
    </div>
  );
};

// GROUPS PAGE
const MyGroups: React.FC = () => {
  const [groups,        setGroups]   = useState<GroupModalData[]>(INITIAL_GROUPS);
  const [search,        setSearch]   = useState("");
  const [selectedGroup, setSelected] = useState<GroupModalData | null>(null);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (updated: GroupModalData) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const handleLeave = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
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
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="groups-search__icon">🔍</span>
          </div>
        </div>

        <div className="groups-list">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => setSelected(group)}
              />
            ))
          ) : (
            <p className="groups-empty">No groups found.</p>
          )}
        </div>

        <button className="groups-join-btn">+ Join more groups</button>
      </div>

      {selectedGroup && (
        <GroupModal
          group={selectedGroup}
          currentUserId={CURRENT_USER_ID}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
};

export default MyGroups;
