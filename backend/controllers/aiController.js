const Expense = require("../models/Expense");
const aiService = require("../services/aiService");

const MAX_MESSAGE_LENGTH = 600;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function startOfPreviousMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function monthKey(date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function formatExpense(expense) {
  return {
    title: expense.title,
    amount: Number(expense.amount || 0),
    category: expense.category || "Other",
    date: expense.date
  };
}

function sumExpenses(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function categoryTotals(expenses) {
  return expenses.reduce((totals, expense) => {
    const category = expense.category || "Other";
    totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function buildMonthTotals(expenses) {
  return expenses.reduce((totals, expense) => {
    const date = new Date(expense.date);
    const key = monthKey(date);
    totals[key] = roundMoney((totals[key] || 0) + Number(expense.amount || 0));
    return totals;
  }, {});
}

function getLargestExpense(expenses) {
  if (!expenses.length) return null;

  return formatExpense(
    expenses.reduce((largest, expense) =>
      Number(expense.amount || 0) > Number(largest.amount || 0) ? expense : largest
    )
  );
}

function getHighestCategory(totals) {
  const entries = Object.entries(totals);
  if (!entries.length) return null;

  const [category, amount] = entries.reduce((highest, entry) =>
    entry[1] > highest[1] ? entry : highest
  );

  return { category, amount: roundMoney(amount) };
}

function calculateLocalPrediction(expenses) {
  const amounts = expenses
    .map((expense) => Number(expense.amount))
    .filter((amount) => Number.isFinite(amount));

  if (amounts.length === 0) return 0;
  if (amounts.length === 1) return amounts[0];

  const points = amounts.map((amount, index) => ({ x: index, y: amount }));
  const count = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
  const denominator = count * sumXX - sumX * sumX;

  if (denominator === 0) {
    return roundMoney(sumY / count);
  }

  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;
  return Math.max(0, roundMoney(slope * count + intercept));
}

async function buildFinancialContext(userId, body) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const previousMonthStart = startOfPreviousMonth(now);
  const monthlyBudget = Number(body.monthlyBudget);
  const frontendPrediction = Number(body.predictedNextMonthExpense);

  const expenses = await Expense.find({ user: userId })
    .sort({ date: -1 })
    .limit(500)
    .lean();

  const currentMonthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date >= currentMonthStart && date < nextMonthStart;
  });

  const previousMonthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date >= previousMonthStart && date < currentMonthStart;
  });

  const currentMonthTotal = roundMoney(sumExpenses(currentMonthExpenses));
  const previousMonthTotal = roundMoney(sumExpenses(previousMonthExpenses));
  const currentCategoryTotals = categoryTotals(currentMonthExpenses);
  const allCategoryTotals = categoryTotals(expenses);
  const budgetAvailable = Number.isFinite(monthlyBudget) && monthlyBudget > 0;
  const predictionAvailable = Number.isFinite(frontendPrediction) && frontendPrediction >= 0;

  return {
    currency: "Rs.",
    generatedAt: now.toISOString(),
    currentMonth: monthKey(now),
    previousMonth: monthKey(previousMonthStart),
    totals: {
      allTimeExpense: roundMoney(sumExpenses(expenses)),
      expenseCount: expenses.length,
      currentMonthExpense: currentMonthTotal,
      previousMonthExpense: previousMonthTotal,
      monthOverMonthChange: roundMoney(currentMonthTotal - previousMonthTotal)
    },
    monthlyBudget: budgetAvailable ? roundMoney(monthlyBudget) : null,
    budget: {
      available: budgetAvailable,
      used: currentMonthTotal,
      remaining: budgetAvailable ? roundMoney(Math.max(0, monthlyBudget - currentMonthTotal)) : null,
      usedPercent: budgetAvailable ? roundMoney((currentMonthTotal / monthlyBudget) * 100) : null,
      isWithinBudget: budgetAvailable ? currentMonthTotal <= monthlyBudget : null
    },
    prediction: {
      nextMonthExpense: predictionAvailable
        ? roundMoney(frontendPrediction)
        : calculateLocalPrediction(expenses),
      source: predictionAvailable ? "existing app prediction" : "backend local fallback"
    },
    categorySpending: Object.fromEntries(
      Object.entries(currentCategoryTotals).map(([category, amount]) => [category, roundMoney(amount)])
    ),
    allTimeCategorySpending: Object.fromEntries(
      Object.entries(allCategoryTotals).map(([category, amount]) => [category, roundMoney(amount)])
    ),
    highestCurrentMonthCategory: getHighestCategory(currentCategoryTotals),
    biggestExpense: getLargestExpense(expenses),
    recentExpenses: expenses.slice(0, 10).map(formatExpense),
    note: "All expenses in this context belong only to the authenticated user from the verified JWT."
  };
}

exports.chat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less.` });
    }

    const context = await buildFinancialContext(req.user.id, req.body);
    const aiMessage = await aiService.generateResponse({ message, context });

    res.json({
      success: true,
      message: aiMessage
    });
  } catch (error) {
    console.error("AI chat failed:", error.message);
    res.status(error.status || 500).json({
      success: false,
      message: "Sorry, I couldn't process that request right now. Please try again."
    });
  }
};
