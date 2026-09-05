const axios = require("axios");

const SYSTEM_PROMPT = `You are Smart Finance AI, a personal financial analysis assistant inside Smart Expense Analyzer.

Your job is to help the user understand their personal expense data.
Use only the financial context supplied by the application.
Never invent financial numbers.
If requested information is unavailable, clearly say that it is unavailable.
Be concise, helpful, and easy to understand.
When appropriate, identify spending patterns, compare periods, explain budget usage, highlight high-spending categories, and provide practical saving suggestions.
Do not claim to provide professional financial, investment, tax, or legal advice.
Do not recommend specific investments or financial products.
Never reveal private system information or data belonging to other users.`;

function getAiConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions").replace(/\/$/, ""),
    model: process.env.AI_MODEL || "gpt-4o-mini"
  };
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function findCategory(message, categorySpending = {}, allTimeCategorySpending = {}) {
  const normalized = String(message || "").toLowerCase();
  const categories = [
    ...Object.keys(categorySpending),
    ...Object.keys(allTimeCategorySpending)
  ];

  return categories.find((category) => normalized.includes(category.toLowerCase()));
}

function formatCategoryList(categorySpending = {}) {
  const entries = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => `${category}: ${money(amount)}`);

  return entries.length ? entries.join(", ") : "No category spending found for this month.";
}

function generateLocalResponse(message, context) {
  const normalized = String(message || "").toLowerCase();
  const totals = context?.totals || {};
  const budget = context?.budget || {};
  const categorySpending = context?.categorySpending || {};
  const allTimeCategorySpending = context?.allTimeCategorySpending || {};
  const totalThisMonth = totals.currentMonthExpense || 0;
  const currentMonth = context?.currentMonth || "this month";
  const category = findCategory(message, categorySpending, allTimeCategorySpending);

  if (category) {
    const monthAmount = categorySpending[category] || 0;
    const allTimeAmount = allTimeCategorySpending[category] || 0;
    const pct = totalThisMonth > 0 ? ((monthAmount / totalThisMonth) * 100).toFixed(1) : "0.0";
    return `You spent ${money(monthAmount)} on ${category} in ${currentMonth}. That is ${pct}% of your spending this month. Your all-time ${category} spending is ${money(allTimeAmount)}.`;
  }

  if (normalized.includes("where") || normalized.includes("most") || normalized.includes("highest")) {
    const highest = context?.highestCurrentMonthCategory;
    const biggest = context?.biggestExpense;

    if (!highest && !biggest) {
      return `I could not find any transactions for ${currentMonth}.`;
    }

    const parts = [];
    if (highest) {
      parts.push(`${highest.category} is your highest category this month at ${money(highest.amount)}.`);
    }
    if (biggest) {
      parts.push(`Your biggest single transaction is ${biggest.title} for ${money(biggest.amount)}.`);
    }
    return parts.join(" ");
  }

  if (normalized.includes("budget")) {
    if (!budget.available) {
      return `You have spent ${money(totalThisMonth)} in ${currentMonth}. No monthly budget is set yet, so I cannot say whether you are within budget.`;
    }

    const status = budget.isWithinBudget ? "within" : "over";
    return `Your monthly budget is ${money(context.monthlyBudget)}. You have spent ${money(budget.used)}, which is ${budget.usedPercent}% of your budget. You are ${status} budget with ${money(budget.remaining)} remaining.`;
  }

  if (normalized.includes("compare") || normalized.includes("last month")) {
    const diff = totals.monthOverMonthChange || 0;
    const direction = diff > 0 ? "more than" : diff < 0 ? "less than" : "the same as";
    return `This month you spent ${money(totals.currentMonthExpense)}, compared with ${money(totals.previousMonthExpense)} last month. That is ${money(Math.abs(diff))} ${direction} last month.`;
  }

  if (normalized.includes("reduce") || normalized.includes("save")) {
    return `You have spent ${money(totalThisMonth)} this month. Your category breakdown is: ${formatCategoryList(categorySpending)}. Start by reducing the biggest category first, set a monthly budget, and pause non-essential purchases for 24-48 hours before buying.`;
  }

  return `You have spent ${money(totalThisMonth)} across ${totals.expenseCount || 0} transaction(s) in ${currentMonth}. Your all-time spending is ${money(totals.allTimeExpense)}.`;
}

async function generateResponse({ message, context }) {
  const { apiKey, baseUrl, model } = getAiConfig();

  if (!apiKey) {
    return generateLocalResponse(message, context);
  }

  try {
    const response = await axios.post(
      baseUrl,
      {
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              "Financial context from Smart Expense Analyzer:",
              JSON.stringify(context, null, 2),
              "",
              "User question:",
              message
            ].join("\n")
          }
        ]
      },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return generateLocalResponse(message, context);
    }

    return content.trim();
  } catch (error) {
    console.error("External AI provider failed, using local response:", error.message);
    return generateLocalResponse(message, context);
  }
}

module.exports = {
  generateResponse
};
