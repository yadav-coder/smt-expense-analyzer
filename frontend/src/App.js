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

function App() {

  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [prediction, setPrediction] = useState(0);

  // 🔹 Modal States
  const [showModal, setShowModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);

  // 🔹 Budget
  const [budget, setBudget] = useState("");
  const lastAlert = useRef("");

  // ============================

  const loadExpenses = async () => {
    setLoading(true);

    const data = await getExpenses();
    setExpenses(data);

    const result = await getPrediction(data);
    setPrediction(result?.prediction || 0);

    setLoading(false);
  };

  // ============================

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

  // ============================

  const totalExpense = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  // 🔹 Budget Alert Logic
  useEffect(() => {
    if (!budget || budget <= 0 || totalExpense === 0) {
      lastAlert.current = "";
      return;
    }

    const percent = Number(
      ((totalExpense / Number(budget)) * 100).toFixed(1)
    );

    const message = `₹${totalExpense} / ₹${budget} used (${percent}%)`;

    if (percent < 50) {
      lastAlert.current = "";
      return;
    }

    if (percent >= 100 && lastAlert.current !== "100") {
      toast.error(`🚨 Budget Exceeded! ${message}`);
      lastAlert.current = "100";
    }
    else if (percent >= 95 && lastAlert.current !== "95") {
      toast.error(`🔴 Critical Level! ${message}`);
      lastAlert.current = "95";
    }
    else if (percent >= 90 && lastAlert.current !== "90") {
      toast.warn(`🟠 High Usage! ${message}`);
      lastAlert.current = "90";
    }
    else if (percent >= 70 && lastAlert.current !== "70") {
      toast.info(`🟡 Moderate Usage! ${message}`);
      lastAlert.current = "70";
    }
    else if (percent >= 50 && lastAlert.current !== "50") {
      toast.info(`🟢 Half Budget Used! ${message}`);
      lastAlert.current = "50";
    }

  }, [totalExpense, budget]);

  // ============================

  useEffect(() => {
    loadExpenses();
  }, []);

  // ============================

  return (
    <div className="container">

      <ToastContainer />

      <Header />

      <AddExpense onAddExpense={addExpenseHandler} />

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

      <h3>Expense List</h3>

      {loading && <p>Loading...</p>}

      <ul>
        {expenses.map((exp) => (
          <li key={exp._id} className="expense-item">

            <span>
              {exp.title} - ₹{exp.amount} ({exp.category})
            </span>

            <div>
              <button onClick={() => editExpenseHandler(exp)}>
                Edit
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  deleteExpenseHandler(exp._id, exp.title)
                }
              >
                Delete
              </button>
            </div>

          </li>
        ))}
      </ul>

      <h3>Total Expense: ₹{totalExpense}</h3>

      <h3>Predicted Next Month Expense: ₹{prediction}</h3>

      <Charts expenses={expenses} />

      {/* ✅ CATEGORY MODAL */}
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
