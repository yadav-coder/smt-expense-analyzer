import { getAuthToken } from "./api";

function getChatbotBaseUrl() {
  if (process.env.REACT_APP_CHATBOT_API_URL) {
    const configuredUrl = process.env.REACT_APP_CHATBOT_API_URL.replace(/\/$/, "");
    return configuredUrl.endsWith("/api") ? configuredUrl : `${configuredUrl}/api`;
  }

  // Local development default
  return "http://localhost:8000/api";
}

const CHATBOT_BASE_URL = getChatbotBaseUrl();

/**
 * Sends a message to the FastAPI Chatbot service.
 * @param {Object} params
 * @param {string} params.message - The question to ask
 * @param {number} [params.monthlyBudget] - Current user budget
 * @param {number} [params.predictedNextMonthExpense] - Trend prediction
 * @returns {Promise<{success: boolean, response: string, intent?: string}>}
 */
export async function sendChatMessage({ message, monthlyBudget, predictedNextMonthExpense }) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Please log in to chat with your financial assistant.");
  }

  try {
    const res = await fetch(`${CHATBOT_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message: String(message || "").trim(),
        monthly_budget: Number.isFinite(Number(monthlyBudget)) ? Number(monthlyBudget) : null,
        predicted_next_month_expense: Number.isFinite(Number(predictedNextMonthExpense))
          ? Number(predictedNextMonthExpense)
          : null
      })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || data?.detail || "Unable to reach the assistant.";
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Could not reach AI Chatbot service at ${CHATBOT_BASE_URL}. Ensure the service is running on port 8000.`
      );
    }
    throw err;
  }
}
