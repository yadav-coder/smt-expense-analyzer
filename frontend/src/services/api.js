function getBaseUrl() {
  if (process.env.REACT_APP_API_URL) {
    const configuredUrl = process.env.REACT_APP_API_URL.replace(/\/$/, "");
    return configuredUrl.endsWith("/api") ? configuredUrl : `${configuredUrl}/api`;
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  return "";
}

const BASE_URL = getBaseUrl();
let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

async function request(path, options = {}) {
  if (!BASE_URL) {
    throw new Error(
      "Missing REACT_APP_API_URL. Set it to your deployed backend URL, for example https://your-backend.onrender.com/api."
    );
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

export const sendAiChatMessage = ({ message, monthlyBudget, predictedNextMonthExpense }) =>
  request("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, monthlyBudget, predictedNextMonthExpense })
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
