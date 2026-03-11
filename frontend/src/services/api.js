const API_URL = "http://localhost:5000/api/expenses";
const CATEGORY_URL = "http://localhost:5000/api/categories";

export const getExpenses = async () => {
  const res = await fetch(API_URL);
  return res.json();
};

export const addExpense = async (expense) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });
  return res.json();
};

export const getPrediction = async (expenses) => {
  const res = await fetch("http://localhost:5000/api/expenses/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expenses }),
  });
  return res.json();
};

export const deleteExpense = async (id) => {
  await fetch(`http://localhost:5000/api/expenses/${id}`, {
    method: "DELETE",
  });
};

export const updateExpense = async (id, expense) => {
  const res = await fetch(
    `http://localhost:5000/api/expenses/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    }
  );
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(CATEGORY_URL);
  return res.json();
};

export const renameCategory = async (oldName, newName) => {
  const res = await fetch(`${CATEGORY_URL}/rename`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldName, newName }),
  });
  return res.json();
};

export const deleteCategory = async (name) => {
  const res = await fetch(
    `${CATEGORY_URL}/${encodeURIComponent(name)}`,
    { method: "DELETE" }
  );
  return res.json();
};

