import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import AddExpense from "./components/AddExpense";
import CategoryManager from "./components/CategoryManager";
import CategoryModal from "./components/CategoryModal";
import Charts from "./components/Charts";
import Footer from "./components/Footer";
import AIAssistant from "./pages/AIAssistant";

import "./App.css";

import {
  addExpense,
  deleteExpense,
  getExpenses,
  getPrediction,
  loginUser,
  registerUser,
  setAuthToken,
  updateExpense
} from "./services/api";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "D" },
  { path: "/expenses", label: "Expenses", icon: "E" },
  { path: "/add-expense", label: "Add Expense", icon: "+" },
  { path: "/budget", label: "Budget", icon: "B" },
  { path: "/charts", label: "Charts", icon: "C" },
  { path: "/categories", label: "Categories", icon: "G" },
  { path: "/ai-assistant", label: "AI Assistant", icon: "AI" }
];

const pageTitles = {
  "/dashboard": "Dashboard",
  "/expenses": "Expenses",
  "/add-expense": "Add Expense",
  "/budget": "Budget",
  "/charts": "Charts",
  "/categories": "Categories",
  "/ai-assistant": "AI Assistant"
};

function calculateLocalPrediction(expenses) {
  const amounts = expenses
    .map((expense) => Number(expense.amount))
    .filter((amount) => Number.isFinite(amount));

  if (amounts.length === 0) return 0;
  if (amounts.length === 1) return amounts[0];

  const points = amounts.map((amount, index) => ({ x: index, y: amount }));
  const count = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
  const denominator = count * sumXX - sumX * sumX;

  if (denominator === 0) {
    return Math.round((sumY / count) * 100) / 100;
  }

  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;
  const nextValue = slope * count + intercept;

  return Math.max(0, Math.round(nextValue * 100) / 100);
}

function getCategoryTotals(expenses) {
  return expenses.reduce((acc, expense) => {
    const category = expense.category || "Uncategorized";
    const amount = Number(expense.amount);
    if (!Number.isFinite(amount)) return acc;

    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});
}

function formatCurrency(value) {
  const amount = Number(value);
  return `Rs.${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

function getInitials(user) {
  return (user?.name || "User")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const isRegister = mode === "register";

  const validateForm = () => {
    const nextErrors = {};

    if (isRegister && !form.name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (isRegister && form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setAuthMessage("");
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setAuthLoading(true);
      setAuthMessage("");

      if (!isRegister) {
        const result = await loginUser({
          email: form.email,
          password: form.password
        });

        setAuthToken(result.token);
        onAuth(result.user);
        navigate("/dashboard", { replace: true });
        return;
      }

      const result = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password
      });

      setAuthMessage(result.message || "Registration successful. Please login now.");
      toast.success(result.message || "Registration successful. Please login now.");
      setForm((prev) => ({
        ...prev,
        name: "",
        confirmPassword: "",
        password: ""
      }));
      navigate("/login", { replace: true });
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <header className="auth-brand">
        <div className="brand-mark">
          <span />
        </div>
        <div>
          <h1>Smart Expense Analyzer</h1>
          <p>Track. Analyze. Predict.</p>
        </div>
      </header>

      <section className="auth-layout" aria-label="Authentication">
        <aside className="auth-copy-panel">
          <span className="eyebrow">Secure Access</span>
          <h2>Manage your expense workspace.</h2>
          <p>Sign in to view your dashboard, expenses, budgets, charts, and categories.</p>
        </aside>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Authentication tabs">
            <NavLink to="/login" className={!isRegister ? "active" : ""}>
              Login
            </NavLink>
            <NavLink to="/register" className={isRegister ? "active" : ""}>
              Register
            </NavLink>
          </div>

          <div className="auth-card-header">
            <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
            <p>{isRegister ? "Register to start using your analyzer." : "Sign in to continue."}</p>
          </div>

          <form className="auth-form" noValidate onSubmit={submitAuth}>
            {isRegister && (
              <label>
                Full Name
                <input
                  className={errors.name ? "input-error" : ""}
                  type="text"
                  placeholder="Suraj Yadav"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>
            )}

            <label>
              Email Address
              <input
                className={errors.email ? "input-error" : ""}
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>

            <label>
              Password
              <input
                className={errors.password ? "input-error" : ""}
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>

            {isRegister && (
              <label>
                Confirm Password
                <input
                  className={errors.confirmPassword ? "input-error" : ""}
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
              </label>
            )}

            {authMessage && (
              <p className={authMessage.toLowerCase().includes("successful") ? "auth-status success" : "auth-status error"}>
                {authMessage}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : isRegister ? "Register" : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <NavLink to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Login" : "Register"}
            </NavLink>
          </p>
        </div>
      </section>
    </main>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ isAuthenticated, children }) {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppShell({
  children,
  currentUser,
  isSidebarOpen,
  onLogout,
  onMenuClose,
  onMenuToggle,
  onToggleTheme,
  theme
}) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";
  const initials = getInitials(currentUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleProfileLogout = () => {
    setIsProfileOpen(false);
    onLogout();
  };

  return (
    <div className="app-shell">
      <div
        className={`mobile-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={onMenuClose}
        aria-hidden={!isSidebarOpen}
      />

      <aside className={`app-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark small">
            <span />
          </div>
          <strong>Smart Expense<br />Analyzer</strong>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onMenuClose}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="top-header">
          <button
            type="button"
            className="menu-button"
            aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isSidebarOpen}
            onClick={onMenuToggle}
          >
            <span />
            <span />
            <span />
          </button>

          <h1>{title}</h1>

          <div className="header-actions">
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === "light" ? "Dark" : "Light"}
            </button>

            <div className="profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="profile-button"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                <span className="avatar">{initials}</span>
                <span className="profile-name">{currentUser?.name || "User"}</span>
                <span className="profile-chevron" aria-hidden="true" />
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-summary">
                    <span className="avatar">{initials}</span>
                    <div>
                      <strong>{currentUser?.name || "User"}</strong>
                      <small>{currentUser?.email || "Signed in"}</small>
                    </div>
                  </div>

                  <div className="profile-dropdown-section">
                    <button type="button" className="dropdown-item" onClick={onToggleTheme} role="menuitem">
                      {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </button>
                  </div>

                  <div className="profile-dropdown-section">
                    <button type="button" className="dropdown-item logout-item" onClick={handleProfileLogout} role="menuitem">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </article>
  );
}

function TransactionList({
  expenses,
  editingExpense,
  editForm,
  loading,
  onCancelEdit,
  onDelete,
  onEditFieldChange,
  onSaveEdit,
  onStartEdit,
  short = false
}) {
  if (loading) {
    return <div className="state-card">Loading expenses...</div>;
  }

  if (!expenses.length) {
    return <div className="state-card">No expenses yet.</div>;
  }

  const visibleExpenses = expenses;

  return (
    <div className={`expense-list ${short ? "short-list" : ""}`}>
      <div className="expense-list-head">
        <span>Title</span>
        <span>Category</span>
        <span>Date</span>
        <span>Amount</span>
        {!short && <span>Actions</span>}
      </div>

      {visibleExpenses.map((exp) => (
        <div key={exp._id} className="expense-row">
          {editingExpense === exp._id ? (
            <div className="expense-edit-row">
              <input
                value={editForm.title}
                onChange={(e) => onEditFieldChange("title", e.target.value)}
                aria-label="Expense title"
              />
              <input
                value={editForm.category}
                onChange={(e) => onEditFieldChange("category", e.target.value)}
                aria-label="Expense category"
              />
              <input
                type="number"
                min="1"
                value={editForm.amount}
                onChange={(e) => onEditFieldChange("amount", e.target.value)}
                aria-label="Expense amount"
              />
              <div className="row-actions">
                <button onClick={() => onSaveEdit(exp._id)}>Save</button>
                <button className="secondary-btn" onClick={onCancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="expense-title">
                <strong>{exp.title}</strong>
                <small>{exp.category || "Other"}</small>
              </div>
              <span data-label="Category">{exp.category || "Other"}</span>
              <span data-label="Date">{exp.date ? new Date(exp.date).toLocaleDateString() : "No date"}</span>
              <strong data-label="Amount">{formatCurrency(exp.amount)}</strong>
              {!short && (
                <div className="row-actions">
                  <button onClick={() => onStartEdit(exp)}>Edit</button>
                  <button className="delete-btn" onClick={() => onDelete(exp._id, exp.title)}>
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function DashboardPage({
  budgetRemaining,
  budgetUsedPercent,
  budgetValue,
  categoryCount,
  expenses,
  hasBudget,
  loading,
  prediction,
  predictionLoading,
  totalExpense,
  user
}) {
  const latestTransactions = [...expenses];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name || "User"}`}
        subtitle="Here's your spending overview."
      />

      <section className="stat-grid">
        <StatCard
          label="Insights"
          value={`${categoryCount} categories`}
          detail={expenses.length === 1 ? "1 expense item" : `${expenses.length} expense items`}
        />
        <StatCard
          label="Total Balance"
          value={formatCurrency(hasBudget ? budgetValue : 0)}
          detail={hasBudget ? `Remaining ${formatCurrency(budgetRemaining)}` : "Budget target"}
        />
        <StatCard
          label="Spent This Month"
          value={formatCurrency(totalExpense)}
          detail={hasBudget ? `${budgetUsedPercent}% of budget` : "No budget set"}
        />
        <StatCard
          label="Prediction"
          value={predictionLoading ? "Calculating..." : formatCurrency(prediction)}
          detail="Projected next cycle"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Category Spending</h3>
          </div>
          <Charts expenses={expenses} compact />
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Latest Transactions</h3>
            <NavLink className="text-button" to="/expenses">View All Expenses</NavLink>
          </div>
          <TransactionList expenses={latestTransactions} loading={loading} short />
        </div>
      </section>
    </>
  );
}

function ExpensesPage(props) {
  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="View and manage your expenses."
        action={<NavLink className="primary-link" to="/add-expense">+ Add Expense</NavLink>}
      />
      <section className="panel">
        <TransactionList {...props} />
      </section>
      <div className="expense-totals">
        <StatCard label="Total Expense" value={formatCurrency(props.totalExpense)} />
        <StatCard
          label="Predicted Next Month Expense"
          value={props.predictionLoading ? "Calculating..." : formatCurrency(props.prediction)}
        />
      </div>
    </>
  );
}

function AddExpensePage({ onAddExpense, onExpensesAdded }) {
  return (
    <>
      <PageHeader
        title="Add Expense"
        subtitle="Record a new expense with the existing fields."
        action={<NavLink className="secondary-link" to="/expenses">Back to Expenses</NavLink>}
      />
      <section className="form-panel">
        <AddExpense onAddExpense={onAddExpense} onExpensesAdded={onExpensesAdded} />
      </section>
    </>
  );
}

function BudgetPage({
  budget,
  budgetRemaining,
  budgetUsedPercent,
  hasBudget,
  onBudgetChange,
  totalExpense
}) {
  const clampedPercent = Math.min(100, budgetUsedPercent);

  return (
    <>
      <PageHeader title="Budget" subtitle="Set and review your monthly budget." />
      <section className="budget-layout">
        <div className="form-panel">
          <h3>Set Monthly Budget</h3>
          <label>
            Monthly Budget
            <input
              type="number"
              placeholder="Enter Budget"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
            />
          </label>
        </div>

        <div className="panel budget-card">
          <StatCard label="Monthly Budget" value={formatCurrency(hasBudget ? budget : 0)} />
          <StatCard label="Current Spending" value={formatCurrency(totalExpense)} />
          <StatCard
            label="Remaining"
            value={hasBudget ? formatCurrency(budgetRemaining) : "No data available"}
          />
          <div className="budget-progress" aria-label="Budget usage">
            <span style={{ width: `${clampedPercent}%` }} />
          </div>
          <p>{hasBudget ? `${budgetUsedPercent}% used` : "No budget set."}</p>
        </div>
      </section>
    </>
  );
}

function ChartsPage({ expenses }) {
  return (
    <>
      <PageHeader title="Charts" subtitle="Review your existing expense charts." />
      <section className="panel">
        <Charts expenses={expenses} />
      </section>
    </>
  );
}

function CategoriesPage({ expensesVersion, onCategoriesChanged }) {
  return (
    <>
      <PageHeader title="Categories" subtitle="Rename or delete existing categories." />
      <CategoryManager
        expensesVersion={expensesVersion}
        onCategoriesChanged={onCategoriesChanged}
      />
    </>
  );
}


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [prediction, setPrediction] = useState(0);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", amount: "", category: "" });

  const [budget, setBudget] = useState("");
  const [theme, setTheme] = useState("light");
  const lastAlert = useRef("");

  const totalExpense = expenses.reduce((sum, e) => {
    const amount = Number(e.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const categoryTotals = getCategoryTotals(expenses);
  const categoryCount = Object.keys(categoryTotals).length;
  const budgetValue = Number(budget);
  const hasBudget = Number.isFinite(budgetValue) && budgetValue > 0;
  const budgetRemaining = hasBudget ? Math.max(0, budgetValue - totalExpense) : 0;
  const budgetUsedPercent = hasBudget ? Number(((totalExpense / budgetValue) * 100).toFixed(1)) : 0;

  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const refreshPrediction = async () => {
      if (!expenses || expenses.length < 2) {
        setPrediction(calculateLocalPrediction(expenses || []));
        setPredictionLoading(false);
        return;
      }

      try {
        setPredictionLoading(true);
        const result = await getPrediction(expenses);
        const nextPrediction = Number(result?.prediction);

        if (!Number.isFinite(nextPrediction)) {
          throw new Error("Invalid prediction value");
        }

        setPrediction(Math.max(0, nextPrediction));
      } catch (error) {
        setPrediction(calculateLocalPrediction(expenses));
      } finally {
        setPredictionLoading(false);
      }
    };

    refreshPrediction();
  }, [expenses]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data || []);
    } catch (error) {
      toast.error("Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  const addExpenseHandler = async (expense) => {
    try {
      const result = await addExpense(expense);

      if (result?.needCategory) {
        setPendingExpense(result);
        setShowModal(true);
        return;
      }

      toast.success("Expense added successfully.");
      await loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to add expense");
    }
  };

  const saveCategoryHandler = async (category) => {
    if (!pendingExpense) return;

    try {
      await addExpense({
        title: pendingExpense.title,
        amount: pendingExpense.amount,
        category
      });

      setShowModal(false);
      setPendingExpense(null);
      toast.success("Category saved successfully.");
      await loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to save category");
    }
  };

  const deleteExpenseHandler = async (id, title) => {
    try {
      await deleteExpense(id);
      toast.info(`${title} deleted successfully.`);
      await loadExpenses();
    } catch (error) {
      toast.error(error.message || `Failed to delete ${title}`);
    }
  };

  const startEditExpense = (expense) => {
    setEditingExpense(expense._id);
    setEditForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category || "Other"
    });
  };

  const cancelEditExpense = () => {
    setEditingExpense(null);
    setEditForm({ title: "", amount: "", category: "" });
  };

  const editExpenseHandler = async (id) => {
    try {
      await updateExpense(id, {
        title: editForm.title,
        amount: editForm.amount,
        category: editForm.category
      });

      toast.info("Expense updated successfully.");
      cancelEditExpense();
      await loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to update expense");
    }
  };

  useEffect(() => {
    if (!hasBudget || totalExpense === 0) {
      lastAlert.current = "";
      return;
    }

    const percent = Number(((totalExpense / budgetValue) * 100).toFixed(1));
    const message = `${formatCurrency(totalExpense)} / ${formatCurrency(budgetValue)} used (${percent}%)`;

    if (percent < 50) {
      lastAlert.current = "";
      return;
    }

    if (percent >= 100 && lastAlert.current !== "100") {
      toast.error(`Budget Exceeded! ${message}`);
      lastAlert.current = "100";
    } else if (percent >= 95 && lastAlert.current !== "95") {
      toast.error(`Critical Level! ${message}`);
      lastAlert.current = "95";
    } else if (percent >= 90 && lastAlert.current !== "90") {
      toast.warn(`High Usage! ${message}`);
      lastAlert.current = "90";
    } else if (percent >= 70 && lastAlert.current !== "70") {
      toast.info(`Moderate Usage! ${message}`);
      lastAlert.current = "70";
    } else if (percent >= 50 && lastAlert.current !== "50") {
      toast.info(`Half Budget Used! ${message}`);
      lastAlert.current = "50";
    }
  }, [totalExpense, budget, hasBudget, budgetValue]);

  useEffect(() => {
    if (isAuthenticated) {
      loadExpenses();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleAuth = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsSidebarOpen(false);
  };

  const appRoutes = (
    <AppShell
      currentUser={currentUser}
      isSidebarOpen={isSidebarOpen}
      onLogout={handleLogout}
      onMenuClose={() => setIsSidebarOpen(false)}
      onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
      onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      theme={theme}
    >
      <Routes>
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              budgetRemaining={budgetRemaining}
              budgetUsedPercent={budgetUsedPercent}
              budgetValue={budgetValue}
              categoryCount={categoryCount}
              expenses={expenses}
              hasBudget={hasBudget}
              loading={loading}
              prediction={prediction}
              predictionLoading={predictionLoading}
              totalExpense={totalExpense}
              user={currentUser}
            />
          }
        />
        <Route
          path="/expenses"
          element={
            <ExpensesPage
              editForm={editForm}
              editingExpense={editingExpense}
              expenses={expenses}
              loading={loading}
              onCancelEdit={cancelEditExpense}
              onDelete={deleteExpenseHandler}
              onEditFieldChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
              onSaveEdit={editExpenseHandler}
              onStartEdit={startEditExpense}
              prediction={prediction}
              predictionLoading={predictionLoading}
              totalExpense={totalExpense}
            />
          }
        />
        <Route
          path="/add-expense"
          element={
            <AddExpensePage
              onAddExpense={addExpenseHandler}
              onExpensesAdded={loadExpenses}
            />
          }
        />
        <Route
          path="/budget"
          element={
            <BudgetPage
              budget={budget}
              budgetRemaining={budgetRemaining}
              budgetUsedPercent={budgetUsedPercent}
              hasBudget={hasBudget}
              onBudgetChange={(value) => {
                setBudget(value);
                lastAlert.current = "";
              }}
              totalExpense={totalExpense}
            />
          }
        />
        <Route path="/charts" element={<ChartsPage expenses={expenses} />} />
        <Route
          path="/categories"
          element={
            <CategoriesPage
              expensesVersion={expenses.length}
              onCategoriesChanged={loadExpenses}
            />
          }
        />
        <Route
          path="/ai-assistant"
          element={<AIAssistant budget={budget} prediction={prediction} />}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );

  return (
    <>
      <ToastContainer position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <AuthPage mode="login" onAuth={handleAuth} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <AuthPage mode="register" onAuth={handleAuth} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              {appRoutes}
            </ProtectedRoute>
          }
        />
      </Routes>

      {showModal && (
        <CategoryModal
          title={pendingExpense.title}
          onSave={saveCategoryHandler}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default App;
