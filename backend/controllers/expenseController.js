const Expense = require("../models/Expense");
const KeywordCategory = require("../models/KeywordCategory");
const axios = require("axios");

function normalizeText(value) {
  return String(value || "").trim();
}

function extractKeywords(title) {
  return normalizeText(title)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
}

function validateExpensePayload(body) {
  const title = normalizeText(body.title);
  const amount = Number(body.amount);
  const category = normalizeText(body.category);

  if (!title) {
    return { error: "Title is required" };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  return { title, amount, category };
}

async function detectCategorySmart(title) {
  const words = extractKeywords(title);

  const found = await KeywordCategory.findOne({
    keyword: { $in: words }
  });

  if (found) return found.category;

  const rules = {
    food: "Food",
    lunch: "Food",
    dinner: "Food",
    coffee: "Food",
    grocery: "Groceries",
    groceries: "Groceries",
    cloth: "Clothing",
    clothes: "Clothing",
    shirt: "Clothing",
    pant: "Clothing",
    phone: "Mobile",
    mobile: "Mobile",
    bus: "Transport",
    train: "Transport",
    cab: "Transport",
    taxi: "Transport",
    laptop: "Electronics",
    charger: "Electronics"
  };

  for (const word of words) {
    if (rules[word]) return rules[word];
  }

  return null;
}

async function learnCategoryFromTitle(title, category) {
  const words = extractKeywords(title);

  await Promise.all(
    words.map((word) =>
      KeywordCategory.updateOne(
        { keyword: word },
        { $set: { category } },
        { upsert: true }
      )
    )
  );
}

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching expenses",
      error: error.message
    });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const payload = validateExpensePayload(req.body);

    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    let category = payload.category;

    if (!category) {
      category = await detectCategorySmart(payload.title);
    }

    if (!category) {
      return res.status(202).json({
        needCategory: true,
        title: payload.title,
        amount: payload.amount
      });
    }

    if (payload.category) {
      await learnCategoryFromTitle(payload.title, category);
    }

    const expense = new Expense({
      title: payload.title,
      amount: payload.amount,
      category
    });

    await expense.save();

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting expense",
      error: error.message
    });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const update = {};

    if (req.body.title !== undefined) {
      const title = normalizeText(req.body.title);
      if (!title) return res.status(400).json({ message: "Title is required" });
      update.title = title;
    }

    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      update.amount = amount;
    }

    if (req.body.category !== undefined) {
      const category = normalizeText(req.body.category);
      if (!category) return res.status(400).json({ message: "Category is required" });
      update.category = category;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (update.title && update.category) {
      await learnCategoryFromTitle(update.title, update.category);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Error updating expense",
      error: error.message
    });
  }
};

exports.getPrediction = async (req, res) => {
  try {
    const expenses = Array.isArray(req.body.expenses) ? req.body.expenses : [];

    if (expenses.length === 0) {
      return res.status(400).json({ message: "Expenses array is required" });
    }

    const response = await axios.post(
      process.env.ML_SERVICE_URL || "https://smt-expense-analyzer-ml.onrender.com/predict",
      { expenses },
      { timeout: 180000 }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Prediction failed",
      error: error.response?.data || error.message
    });
  }
};
