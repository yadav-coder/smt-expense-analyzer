import { useState } from "react";

function AddExpense({ onAddExpense }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const submitHandler = (event) => {
    event.preventDefault();

    if (!title.trim() || Number(amount) <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount,
    });

    setTitle("");
    setAmount("");
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

      <button type="submit">Add</button>
    </form>
  );
}

export default AddExpense;
