const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await res.json().catch(() => null);

  if (!res.ok && res.status !== 202) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export const getExpenses = () => request("/expenses");

export const addExpense = (expense) =>
  request("/expenses", {
    method: "POST",
    body: JSON.stringify(expense)
  });

export const getPrediction = (expenses) =>
  request("/expenses/predict", {
    method: "POST",
    body: JSON.stringify({ expenses })
  });

export const deleteExpense = (id) =>
  request(`/expenses/${id}`, {
    method: "DELETE"
  });

export const updateExpense = (id, expense) =>
  request(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(expense)
  });

export const getCategories = () => request("/categories");

export const renameCategory = (oldName, newName) =>
  request("/categories/rename", {
    method: "PUT",
    body: JSON.stringify({ oldName, newName })
  });

export const deleteCategory = (name) =>
  request(`/categories/${encodeURIComponent(name)}`, {
    method: "DELETE"
  });
