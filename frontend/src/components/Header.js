import { useState } from "react";

function Header({ isSidebarOpen, onMenuToggle, onMenuClose, user, isAuthenticated, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuItems = [
    { href: "#dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "#add-expense", label: "Add Expense", icon: "plus" },
    { href: "#budget", label: "Budget", icon: "wallet" },
    { href: "#expense-list", label: "Expenses", icon: "list" },
    { href: "#charts", label: "Charts", icon: "chart" }
  ];
  const initials = (user?.name || "User")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    setIsProfileOpen(false);
    onLogout();
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <button
            type="button"
            className="menu-toggle"
            aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isSidebarOpen}
            onClick={onMenuToggle}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="header-copy">
            <h2>Smart Expense Analyzer</h2>
            <p>Track . Analyze . Predict</p>
          </div>

          <div className="profile-menu">
            <button
              type="button"
              className="profile-button"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <span>{initials}</span>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-summary">
                  <strong>{user?.name || "User"}</strong>
                  <small>{user?.email || "Not signed in"}</small>
                </div>

                {isAuthenticated ? (
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsProfileOpen(false)}>
                    Login
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="menu-bar desktop-menu">
          {menuItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={onMenuClose}
        aria-hidden={!isSidebarOpen}
      />

      <aside className={`side-drawer ${isSidebarOpen ? "open" : ""}`}>
        <div className="drawer-profile">
          <div className="drawer-avatar">
            <span>{initials}</span>
          </div>
          <h3>{user?.name || "User"}</h3>
          <p>{user?.email || "Smart Expense Analyzer"}</p>
          <small>Menu</small>
        </div>

        <nav className="drawer-menu">
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} onClick={onMenuClose}>
              <span className={`drawer-icon ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          ))}
          {isAuthenticated && (
            <button type="button" className="drawer-logout" onClick={handleLogout}>
              <span className="drawer-icon logout" aria-hidden="true" />
              <span>Logout</span>
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Header;
