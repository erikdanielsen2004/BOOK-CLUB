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

type GroupTab = "my_groups" | "discover" | "create";

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
          googleBooksId: group.currentBook.googleBooksId || "",
          title: group.currentBook.title || "Untitled",
          author: Array.isArray(group.currentBook.authors) ? group.currentBook.authors.join(", ") : "",
          coverUrl: group.currentBook.thumbnail || null,
          coverColor: colorFromTitle(group.currentBook.title || "Book"),
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

const StatCard: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div className="groups-stat">
    <span className="groups-stat__number">{count}</span>
    <span className="groups-stat__label">{label}</span>
  </div>
);

const GroupCard: React.FC<{
  group: GroupModalData;
  currentUserId: string;
  mode: "my_groups" | "discover";
  onView: () => void;
  onJoin?: () => void;
  joining?: boolean;
}> = ({ group, currentUserId, mode, onView, onJoin, joining }) => {
  const currentBook = group.currentBook;
  const isOwner = group.owner === currentUserId;
  const isMember = group.members.some((m) => m.id === currentUserId);

  return (
    <div className="group-card" onClick={onView}>
      <div
        className="group-card__cover"
        style={{ background: currentBook?.coverColor ?? "#c4b9ae" }}
      >
        {currentBook?.coverUrl && <img src={currentBook.coverUrl} alt={currentBook.title} />}
      </div>

      <div className="group-card__info">
        <div className="group-card__topline">
          <h3 className="group-card__name">{group.name}</h3>
          {isOwner && <span className="group-card__badge">Owner</span>}
          {!isOwner && isMember && <span className="group-card__badge group-card__badge--soft">Joined</span>}
        </div>

        <p className="group-card__members">{group.members.length} members</p>

        {group.description && (
          <p className="group-card__description">{group.description}</p>
        )}

        {currentBook ? (
          <p className="group-card__book">
            Assigned book: <span className="group-card__book-title">{currentBook.title}</span>
            {currentBook.author && <span className="group-card__book-author"> — {currentBook.author}</span>}
          </p>
        ) : group.voteSessionActive ? (
          <p className="group-card__book">Vote in progress for next book</p>
        ) : (
          <p className="group-card__book">No assigned book yet</p>
        )}
      </div>

      <div className="group-card__actions">
        <button
          className="group-card__btn"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          View
        </button>

        {mode === "discover" && !isMember && (
          <button
            className="group-card__btn group-card__btn--primary"
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.();
            }}
            disabled={joining}
          >
            {joining ? "Joining..." : "Join"}
          </button>
        )}
      </div>
    </div>
  );
};

const MyGroups: React.FC = () => {
  const user = getStoredUser();
  const currentUserId = user?._id || user?.id || "";
  const firstName = user?.firstName || "Reader";

  const [activeTab, setActiveTab] = useState<GroupTab>("my_groups");
  const [search, setSearch] = useState("");
  const [myGroups, setMyGroups] = useState<GroupModalData[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupModalData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupModalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [joiningGroupId, setJoiningGroupId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchMyGroups = async (searchValue = "") => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchValue.trim()) query.set("searchBar", searchValue.trim());

      const res = await fetch(`/api/group-main/search/${currentUserId}?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load groups.");

      const mapped = Array.isArray(data.groups) ? data.groups.map(mapGroup) : [];
      setMyGroups(mapped);

      setSelectedGroup((prev) => {
        if (!prev) return null;
        return mapped.find((g) => g.id === prev.id) || prev;
      });
    } catch (err: any) {
      setMessage(err.message || "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoverGroups = async (searchValue = "") => {
    if (!currentUserId) return;

    try {
      setDiscoverLoading(true);
      const query = new URLSearchParams();
      if (searchValue.trim()) query.set("searchBar", searchValue.trim());

      const res = await fetch(`/api/group-main/search?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load groups.");

      const mapped = Array.isArray(data.groups) ? data.groups.map(mapGroup) : [];
      setDiscoverGroups(mapped);
    } catch (err: any) {
      setMessage(err.message || "Failed to load discover groups.");
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    fetchMyGroups();
    fetchDiscoverGroups();
  }, [currentUserId]);

  const filteredMyGroups = useMemo(() => {
    if (!search.trim()) return myGroups;
    return myGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [myGroups, search]);

  const filteredDiscoverGroups = useMemo(() => {
    if (!search.trim()) return discoverGroups;
    return discoverGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [discoverGroups, search]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    try {
      setCreating(true);
      setMessage("");

      const res = await fetch(`/api/group-main/create/${currentUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          description: createDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create group.");

      const newGroup = mapGroup(data.group);
      setMyGroups((prev) => [newGroup, ...prev]);
      setDiscoverGroups((prev) => [newGroup, ...prev]);
      setCreateName("");
      setCreateDescription("");
      setActiveTab("my_groups");
      setMessage("Group created successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to create group.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUserId) return;

    try {
      setJoiningGroupId(groupId);
      setMessage("");

      const res = await fetch(`/api/group-main/join/${currentUserId}/${groupId}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join group.");

      await fetchMyGroups(search);
      await fetchDiscoverGroups(search);
      setMessage("Joined group successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to join group.");
    } finally {
      setJoiningGroupId("");
    }
  };

  const handleModalSave = (updated: GroupModalData) => {
    setMyGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setDiscoverGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGroup(updated);
  };

  const handleModalLeave = (groupId: string) => {
    setMyGroups((prev) => prev.filter((g) => g.id !== groupId));
    setDiscoverGroups((prev) => prev.filter((g) => g.id !== groupId));
    setSelectedGroup(null);
  };

  const totalVotesActive = myGroups.filter((g) => g.voteSessionActive).length;
  const ownerCount = myGroups.filter((g) => g.owner === currentUserId).length;

  return (
    <div className="groups-layout">
      <Sidebar />

      <div className="groups-main">
        <div className="groups-hero">
          <div>
            <h1 className="groups-heading">Groups</h1>
            <p className="groups-subheading">
              Welcome back, {firstName}. Manage your book clubs, discover new groups, and run votes for the next read.
            </p>
          </div>
        </div>

        <div className="groups-stats">
          <StatCard count={myGroups.length} label="My groups" />
          <StatCard count={ownerCount} label="Groups I own" />
          <StatCard count={totalVotesActive} label="Active votes" />
        </div>

        <div className="groups-toolbar">
          <div className="groups-tabs">
            <button
              className={`groups-tab ${activeTab === "my_groups" ? "groups-tab--active" : ""}`}
              onClick={() => setActiveTab("my_groups")}
            >
              My Groups
            </button>
            <button
              className={`groups-tab ${activeTab === "discover" ? "groups-tab--active" : ""}`}
              onClick={() => setActiveTab("discover")}
            >
              Discover
            </button>
            <button
              className={`groups-tab ${activeTab === "create" ? "groups-tab--active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              Create Group
            </button>
          </div>

          <div className="groups-search">
            <input
              type="text"
              placeholder={activeTab === "discover" ? "Search all groups..." : "Search my groups..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="groups-search__icon">🔍</span>
          </div>
        </div>

        {message && <p className="groups-message">{message}</p>}

        {activeTab === "my_groups" && (
          <div className="groups-section">
            {loading ? (
              <p className="groups-empty">Loading groups...</p>
            ) : filteredMyGroups.length > 0 ? (
              <div className="groups-list">
                {filteredMyGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    currentUserId={currentUserId}
                    mode="my_groups"
                    onView={() => setSelectedGroup(group)}
                  />
                ))}
              </div>
            ) : (
              <div className="groups-panel groups-panel--empty">
                <h3>No groups yet</h3>
                <p>You have not joined any groups yet. Browse Discover or create your own.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "discover" && (
          <div className="groups-section">
            {discoverLoading ? (
              <p className="groups-empty">Loading discover groups...</p>
            ) : filteredDiscoverGroups.length > 0 ? (
              <div className="groups-list">
                {filteredDiscoverGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    currentUserId={currentUserId}
                    mode="discover"
                    onView={() => setSelectedGroup(group)}
                    onJoin={() => handleJoinGroup(group.id)}
                    joining={joiningGroupId === group.id}
                  />
                ))}
              </div>
            ) : (
              <div className="groups-panel groups-panel--empty">
                <h3>No matching groups</h3>
                <p>Try another search or create a new group.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="groups-section">
            <div className="groups-panel groups-create">
              <div className="groups-create__intro">
                <h3>Create a new group</h3>
                <p>Start a reading group, invite people to join through Discover, and manage the next assigned book with voting.</p>
              </div>

              <form className="groups-create__form" onSubmit={handleCreateGroup}>
                <label className="groups-field">
                  <span>Group name</span>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Example: Fantasy Fridays"
                    required
                  />
                </label>

                <label className="groups-field">
                  <span>Description</span>
                  <textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="What does your group read or focus on?"
                    rows={5}
                  />
                </label>

                <div className="groups-create__actions">
                  <button type="submit" className="groups-primary-btn" disabled={creating}>
                    {creating ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {selectedGroup && (
        <GroupModal
          group={selectedGroup}
          currentUserId={currentUserId}
          onClose={() => setSelectedGroup(null)}
          onSave={handleModalSave}
          onLeave={handleModalLeave}
        />
      )}
    </div>
  );
};

export default MyGroups;
