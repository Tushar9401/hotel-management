import {
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHotel } from "../context/HotelContext";
import Logo from "./Logo";

export default function AppShell({ role, title, subtitle, children, action }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useHotel();
  const isAdmin = role === "admin";

  const navItems = isAdmin
    ? [
        { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        {
          label: "Room assignments",
          icon: ClipboardCheck,
          path: "/dashboard/assignments",
        },
        { label: "Staff", icon: Users, path: "/dashboard/staff" },
      ]
    : [{ label: "My rooms", icon: ClipboardCheck, path: "/staff" }];

  const signOut = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };
  const displayName = user?.name ?? "";
  const initials = user?.initials ?? "";

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

  return (
    <div className="app-layout">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-head">
          <Logo light />
          <button className="icon-button close-menu" onClick={() => setMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="role-label">{isAdmin ? "Front desk" : "Housekeeping"}</div>
        <nav className="sidebar-nav">
          {navItems.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              className={`nav-item ${location.pathname === path ? "active" : ""}`}
              onClick={() => {
                navigate(path);
                setMenuOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-mini">
            <span className="avatar">{initials}</span>
            <span>
              <strong>{displayName}</strong>
              <small>{user?.roleLabel}</small>
            </span>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="mobile-logo">
            <Logo />
          </div>
          <div className="topbar-spacer" />
          <div className="profile-menu-wrap" ref={profileMenuRef}>
            <button
              className="top-profile"
              onClick={() => setProfileOpen((current) => !current)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <span className="avatar">{initials}</span>
              <span className="profile-copy">
                <strong>{displayName}</strong>
                <small>{isAdmin ? "Admin" : "Housekeeping"}</small>
              </span>
              <ChevronDown
                className={`profile-chevron ${profileOpen ? "open" : ""}`}
                size={15}
              />
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-head">
                  <span className="avatar">{initials}</span>
                  <span>
                    <strong>{displayName}</strong>
                    <small>{user?.roleLabel}</small>
                  </span>
                </div>
                <button className="profile-signout" onClick={signOut} role="menuitem">
                  <LogOut size={17} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {action}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
