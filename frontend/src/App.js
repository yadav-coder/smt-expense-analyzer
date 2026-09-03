import { useEffect, useRef, useState } from "react";
import CategoryManager from "./components/CategoryManager";
import CategoryModal from "./components/CategoryModal";

import Charts from "./components/Charts";
import Footer from "./components/Footer";
import Header from "./components/Header";

import "./App.css";
import AddExpense from "./components/AddExpense";

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

function calculateLocalPrediction(expenses) {
  const amounts = expenses
    .map((expense) => Number(expense.amount))
    .filter((amount) => Number.isFinite(amount));

  if (amounts.length === 0) {
    return 0;
  }

  if (amounts.length === 1) {
    return amounts[0];
  }

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

function AuthPage({ onAuth }) {
  const [activeTab, setActiveTab] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const validateForm = () => {
    const nextErrors = {};

    if (activeTab === "register" && !form.name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (activeTab === "register" && form.confirmPassword !== form.password) {
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

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setAuthMessage("");
  };

  const submitAuth = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setAuthLoading(true);
      setAuthMessage("");

      if (activeTab === "login") {
        const result = await loginUser({
          email: form.email,
          password: form.password
        });

        setAuthToken(result.token);
        onAuth(result.user);
        return;
      }

      const result = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password
      });

      setAuthMessage(result.message || "Registration successful. Please login now.");
      setActiveTab("login");
      setForm((prev) => ({
        ...prev,
        name: "",
        confirmPassword: "",
        password: ""
      }));
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-background" aria-hidden="true">
        <div className="finance-grid">
          <div className="finance-widget widget-income">
            <span className="widget-icon">+</span>
            <div>
              <small>Monthly savings</small>
              <strong>Rs.12,450</strong>
            </div>
          </div>
          <div className="finance-widget widget-spend">
            <span className="widget-icon">-</span>
            <div>
              <small>Card spend</small>
              <strong>Rs.34,890</strong>
            </div>
          </div>
          <div className="floating-chart">
            <span style={{ height: "42%" }} />
            <span style={{ height: "68%" }} />
            <span style={{ height: "54%" }} />
            <span style={{ height: "82%" }} />
            <span style={{ height: "61%" }} />
          </div>
          <div className="pattern-card">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <header className="auth-brand">
        <div className="brand-mark">
          <span />
        </div>
        <div>
          <h1>Smart Expense Analyzer</h1>
          <p>Personal finance intelligence</p>
        </div>
      </header>

      <section className="auth-layout" aria-label="Authentication">
        <aside className="auth-insight-panel" aria-label="Expense insights preview">
          <div className="insight-header">
            <span>Live budget snapshot</span>
            <strong>Sep 2026</strong>
          </div>
          <div className="insight-total">
            <small>Total tracked</small>
            <strong>Rs.48,320</strong>
          </div>
          <div className="insight-bars">
            <div>
              <span>Food</span>
              <i style={{ width: "72%" }} />
            </div>
            <div>
              <span>Travel</span>
              <i style={{ width: "48%" }} />
            </div>
            <div>
              <span>Rent</span>
              <i style={{ width: "86%" }} />
            </div>
          </div>
          <div className="insight-footer">
            <span>Projected next month</span>
            <strong>Rs.51,100</strong>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Authentication tabs">
            <button
              className={activeTab === "login" ? "active" : ""}
              onClick={() => switchTab("login")}
              role="tab"
              aria-selected={activeTab === "login"}
            >
              Login
            </button>
            <button
              className={activeTab === "register" ? "active" : ""}
              onClick={() => switchTab("register")}
              role="tab"
              aria-selected={activeTab === "register"}
            >
              Register
            </button>
          </div>

          <div className="auth-card-header">
            <h2>{activeTab === "login" ? "Welcome back" : "Create your account"}</h2>
            <p>{activeTab === "login" ? "Sign in to continue analyzing your spending." : "Start tracking expenses with smarter insights."}</p>
          </div>

          <form className="auth-form" noValidate onSubmit={submitAuth}>
            {activeTab === "register" && (
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

            {activeTab === "register" && (
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

            {activeTab === "login" && (
              <div className="auth-options">
                <label className="remember-row">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <a href="#forgot-password">Forgot Password?</a>
              </div>
            )}

            {authMessage && (
              <p className={authMessage.toLowerCase().includes("successful") ? "auth-status success" : "auth-status error"}>
                {authMessage}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : activeTab === "login" ? "Login" : "Register"}
            </button>
          </form>

          <p className="auth-switch">
            {activeTab === "login" ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={() => switchTab(activeTab === "login" ? "register" : "login")}>
              {activeTab === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </section>
    </main>
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
  const latestTransactions = [...expenses].slice(0, 5);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([category, amount]) => ({ category, amount }));

  const categoryGradient = (category, index) => {
    const map = {
      Rent: ["#0ea5e9", "#38bdf8"],
      Transport: ["#a855f7", "#c084fc"],
      Health: ["#22c55e", "#4ade80"],
      Groceries: ["#f97316", "#fbbf24"],
    };

    const fallback = [
      ["#6366f1", "#8b5cf6"],
      ["#22c55e", "#14b8a6"],
      ["#f43f5e", "#fb7185"],
      ["#f59e0b", "#fbbf24"],
    ];

    const colors = map[category] || fallback[index % fallback.length];
    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  };

  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

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
      toast.error("Failed to load expenses");
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

      toast.success("Expense Added");
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
        category,
      });

      setShowModal(false);
      setPendingExpense(null);
      toast.success("Category Saved");
      await loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to save category");
    }
  };

  const deleteExpenseHandler = async (id, title) => {
    try {
      await deleteExpense(id);
      toast.info(`${title} deleted`);
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

      toast.info("Expense Updated");
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

  if (!isAuthenticated) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div className="container">
      <ToastContainer />

      <Header
        isSidebarOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        onMenuClose={() => setIsSidebarOpen(false)}
        user={currentUser}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      <section id="dashboard" className="dashboard-panel">
        <div className="dashboard-left">
          <div className="dashboard-top">
            <div>
              <p className="dashboard-label">Welcome back, Suraj!</p>
              <h2>Spending Overview</h2>
              <p className="dashboard-subtitle">
                Your cards, totals, and trends in one place.
              </p>
            </div>

            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          <div className="summary-grid">
            <div className="summary-card dashboard-card">
              <span className="card-title">Insights</span>
              <p className="summary-value">{categoryCount} categories</p>
              <p className="summary-detail">
                {expenses.length === 1 ? "You used 1 expense item." : `You used ${expenses.length} expense items.`}
              </p>
            </div>

            <div className="summary-card dashboard-card highlight-card">
              <span className="card-title">Total balance</span>
              <p className="summary-value">{formatCurrency(hasBudget ? budgetValue : 0)}</p>
              <p className="summary-detail">
                {hasBudget ? `Remaining ${formatCurrency(budgetRemaining)}` : "Budget target"}
              </p>
            </div>

            <div className="summary-card dashboard-card accent-card">
              <span className="card-title">Spent this month</span>
              <p className="summary-value">{formatCurrency(totalExpense)}</p>
              <p className="summary-detail">{budgetUsedPercent}% of budget</p>
            </div>

            <div className="summary-card dashboard-card">
              <span className="card-title">Prediction</span>
              <p className="summary-value">
                {predictionLoading ? "Calculating..." : formatCurrency(prediction)}
              </p>
              <p className="summary-detail">Projected next cycle</p>
            </div>
          </div>
        </div>

        <aside className="dashboard-right">
          <div className="credit-card">
            <div className="card-top">
              <span>My cards</span>
              <span className="card-chip" />
            </div>
            <div className="card-number">5264 0984 1234 4321</div>
            <div className="card-details">
              <div>
                <small>Card holder</small>
                <strong>Suraj Yadav</strong>
              </div>
              <div>
                <small>Expiry</small>
                <strong>09/27</strong>
              </div>
            </div>
          </div>

          <div className="mini-card-grid">
            {topCategories.length > 0 ? (
              topCategories.map((item, index) => (
                <div
                  key={item.category}
                  className="mini-card"
                  style={{ background: categoryGradient(item.category, index) }}
                >
                  <span>{item.category}</span>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))
            ) : (
              <div className="mini-card placeholder-card">
                <span>No categories yet</span>
                <strong>Add an expense to see category cards</strong>
              </div>
            )}
          </div>

          <div className="transactions-card">
            <div className="transactions-header">
              <h4>Latest transactions</h4>
              <a className="text-button" href="#expense-list">Show more</a>
            </div>
            <ul className="transactions-list">
              {latestTransactions.length > 0 ? (
                latestTransactions.map((exp) => (
                  <li key={exp._id}>
                    <span>{exp.title}</span>
                    <strong>{formatCurrency(exp.amount)}</strong>
                  </li>
                ))
              ) : (
                <li className="empty-row">No transactions yet</li>
              )}
            </ul>
          </div>
        </aside>
      </section>

      <section id="add-expense">
        <AddExpense onAddExpense={addExpenseHandler} />
      </section>

      <section id="budget">
        <h3>Set Monthly Budget</h3>

        <input
          type="number"
          placeholder="Enter Budget"
          value={budget}
          onChange={(e) => {
            setBudget(e.target.value);
            lastAlert.current = "";
          }}
        />
      </section>

      <section id="expense-list">
        <h3>Expense List</h3>

        {loading && <p>Loading...</p>}

        <ul>
          {!loading && expenses.length === 0 && (
            <li className="empty-state">No expenses yet. Add your first expense above.</li>
          )}

          {expenses.map((exp) => (
            <li key={exp._id} className="expense-item">
              {editingExpense === exp._id ? (
                <div className="edit-form">
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    aria-label="Expense title"
                  />
                  <input
                    type="number"
                    min="1"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                    aria-label="Expense amount"
                  />
                  <input
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    aria-label="Expense category"
                  />
                  <div className="row-actions">
                    <button onClick={() => editExpenseHandler(exp._id)}>Save</button>
                    <button className="secondary-btn" onClick={cancelEditExpense}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="expense-copy">
                    <strong>{exp.title}</strong>
                    <small>{exp.category || "Other"}</small>
                  </span>

                  <div className="expense-actions">
                    <strong>{formatCurrency(exp.amount)}</strong>
                    <button onClick={() => startEditExpense(exp)}>
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteExpenseHandler(exp._id, exp.title)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="expense-footer-row">
          <h3>Total Expense: {formatCurrency(totalExpense)}</h3>
          <h3>
            Predicted Next Month Expense: {predictionLoading ? "Calculating..." : formatCurrency(prediction)}
          </h3>
        </div>
      </section>

      <section id="charts">
        <Charts expenses={expenses} />
      </section>

      {showModal && (
        <CategoryModal
          title={pendingExpense.title}
          onSave={saveCategoryHandler}
          onClose={() => setShowModal(false)}
        />
      )}

      <CategoryManager
        expensesVersion={expenses.length}
        onCategoriesChanged={loadExpenses}
      />

      <Footer />
    </div>
  );
}

export default App;
