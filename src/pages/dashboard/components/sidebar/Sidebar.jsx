import "./Sidebar.css";
import { useState } from "react";
import { useEffect } from "react";

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const NAV_ITEMS = [
  { id: "reservas",  label: "Reservas",  Icon: CalendarIcon },
  { id: "vehiculos", label: "Vehículos", Icon: TruckIcon },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const [usuario, setUsuario] = useState(null);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      fetch("http://localhost:8080/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUsuario(data))
        .catch(err => console.error(err));
    }, []);
  return (
    <aside className="sidebar">

      {/* User header */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          <UserIcon />
        </div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">User Portal</p>
          <p className="sidebar-user-sub">{usuario?.email ?? "Usuario"}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activePage === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <span className="sidebar-nav-icon">
              <Icon />
            </span>
            <span className="sidebar-nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Log out */}
      <div className="sidebar-footer">
       <button className="sidebar-logout" onClick={onLogout}>
          <span className="sidebar-nav-icon">
            <LogoutIcon />
          </span>
          <span className="sidebar-nav-label">Log out</span>
        </button>
      </div>

    </aside>
  );
}