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

function App() {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [prediction, setPrediction] = useState(0);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);

  const [budget, setBudget] = useState("");
  const lastAlert = useRef("");

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

    const data = await getExpenses();
    setExpenses(data);

    setLoading(false);
  };

  const addExpenseHandler = async (expense) => {
    const result = await addExpense(expense);

    if (result.needCategory) {
      setPendingExpense(result);
      setShowModal(true);
      return;
    }

    toast.success("Expense Added");
    loadExpenses();
  };

  const saveCategoryHandler = async (category) => {
    if (!pendingExpense) return;

    await addExpense({
      title: pendingExpense.title,
      amount: pendingExpense.amount,
      category
    });

    setShowModal(false);
    setPendingExpense(null);

    toast.success("Category Saved");
    loadExpenses();
  };

  const deleteExpenseHandler = async (id, title) => {
    await deleteExpense(id);
    toast.error(`${title} deleted`);
    loadExpenses();
  };

  const editExpenseHandler = async (exp) => {
    const newTitle = prompt("Enter new title", exp.title);
    const newAmount = prompt("Enter new amount", exp.amount);

    if (!newTitle || !newAmount) return;

    await updateExpense(exp._id, {
      title: newTitle,
      amount: newAmount
    });

    toast.info("Expense Updated");
    loadExpenses();
  };

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  useEffect(() => {
    if (!budget || budget <= 0 || totalExpense === 0) {
      lastAlert.current = "";
      return;
    }

    const percent = Number(((totalExpense / Number(budget)) * 100).toFixed(1));
    const message = `Rs.${totalExpense} / Rs.${budget} used (${percent}%)`;

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
  }, [totalExpense, budget]);

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
            setBudget(Number(e.target.value));
            lastAlert.current = "";
          }}
        />
      </section>

      <section id="expense-list">
        <h3>Expense List</h3>

        {loading && <p>Loading...</p>}

        <ul>
          {expenses.map((exp) => (
            <li key={exp._id} className="expense-item">
              <span>
                {exp.title} - Rs.{exp.amount} ({exp.category})
              </span>

              <div>
                <button onClick={() => editExpenseHandler(exp)}>
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteExpenseHandler(exp._id, exp.title)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <h3>Total Expense: Rs.{totalExpense}</h3>

        <h3>
          Predicted Next Month Expense: {predictionLoading ? "Calculating..." : `Rs.${prediction}`}
        </h3>
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

      <CategoryManager />

      <Footer />
    </div>
  );
}

export default App;
