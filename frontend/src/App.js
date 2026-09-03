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

function App() {
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
    loadExpenses();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div className="container">
      <ToastContainer />

      <Header
        isSidebarOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        onMenuClose={() => setIsSidebarOpen(false)}
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
