const BASE_URL = "https://smt-expense-analyzer.onrender.com/api";

export const getExpenses = async () => {
  const res = await fetch(`${BASE_URL}/expenses`);
  return res.json();
};

export const addExpense = async (expense) => {
  const res = await fetch(`${BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });
  return res.json();
};

export const predictExpenses = async (expenses) => {
  const res = await fetch(`${BASE_URL}/expenses/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expenses })
  });

  return res.json();
};

export const getPrediction = async (expenses) => {
  const res = await fetch(`${BASE_URL}/expenses/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expenses }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Prediction request failed");
  }

  return data;
};

export const deleteExpense = async (id) => {
  await fetch(`${BASE_URL}/expenses/${id}`, {
    method: "DELETE",
  });
};

export const updateExpense = async (id, expense) => {
  const res = await fetch(`${BASE_URL}/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories`);
  return res.json();
};

export const renameCategory = async (oldName, newName) => {
  const res = await fetch(`${BASE_URL}/categories/rename`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldName, newName }),
  });
  return res.json();
};

export const deleteCategory = async (name) => {
  const res = await fetch(
    `${BASE_URL}/categories/${encodeURIComponent(name)}`,
    { method: "DELETE" }
  );
  return res.json();
};
