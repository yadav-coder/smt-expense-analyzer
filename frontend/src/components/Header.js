function Header({ isSidebarOpen, onMenuToggle, onMenuClose }) {
  const menuItems = [
    { href: "#dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "#add-expense", label: "Add Expense", icon: "plus" },
    { href: "#budget", label: "Budget", icon: "wallet" },
    { href: "#expense-list", label: "Expenses", icon: "list" },
    { href: "#charts", label: "Charts", icon: "chart" }
  ];

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
            <span>SY</span>
          </div>
          <h3>Suraj Yadav</h3>
          <p>Smart Expense Analyzer</p>
          <small>Menu</small>
        </div>

        <nav className="drawer-menu">
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} onClick={onMenuClose}>
              <span className={`drawer-icon ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Header;
