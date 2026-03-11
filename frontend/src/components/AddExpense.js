import { useState } from "react";

function AddExpense({ onAddExpense }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const submitHandler = () => {
    if (!title || !amount) return;

    onAddExpense({
      title,
      amount,
    });

    setTitle("");
    setAmount("");
  };

  return (
    <div>
      <h3>Add Expense</h3>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={submitHandler}>Add</button>
    </div>
  );
}

export default AddExpense;
