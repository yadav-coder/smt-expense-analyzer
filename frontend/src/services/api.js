function getBaseUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, "");
  }

  const hostname = window.location.hostname;

  if (hostname.includes("onrender.com") && hostname.includes("frontend")) {
    return `https://${hostname.replace("frontend", "backend")}/api`;
  }

  return "http://localhost:5000/api";
}

const BASE_URL = getBaseUrl();

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Could not reach backend API at ${BASE_URL}`);
    }

    throw error;
  }
}

export const getExpenses = () => request("/expenses");

export const registerUser = (user) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(user)
  });

export const loginUser = (credentials) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });

export const getExpenseSummary = () => request("/expenses/summary");

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
