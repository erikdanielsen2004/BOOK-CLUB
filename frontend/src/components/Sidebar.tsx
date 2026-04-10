import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Shelf", path: "/myshelf" },
    { label: "My Groups", path: "/groups" },
    { label: "Books", path: "/books" },
    { label: "Reviews", path: "/reviews" }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__logo">The Book Club</div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`sidebar__link ${location.pathname === item.path ? "sidebar__link--active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <button className="sidebar__logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
