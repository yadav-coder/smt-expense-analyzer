import { useState } from "react";

function AddExpense({ onAddExpense }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  const categories = [
    "Food",
    "Groceries",
    "Transport",
    "Rent",
    "Bills",
    "Health",
    "Education",
    "Clothing",
    "Electronics",
    "Mobile",
    "Other"
  ];

  const submitHandler = (event) => {
    event.preventDefault();

    if (!title.trim() || Number(amount) <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount,
      category,
      date,
    });

    setTitle("");
    setAmount("");
    setCategory("");
    setDate("");
  };

  return (
    <form className="expense-form" onSubmit={submitHandler}>
      <h3>Add Expense</h3>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Amount"
        type="number"
        min="1"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Auto category</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <button type="submit">Add</button>
    </form>
  );
}

export default AddExpense;
