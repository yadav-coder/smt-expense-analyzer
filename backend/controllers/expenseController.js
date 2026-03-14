const Expense = require("../models/Expense");
const KeywordCategory = require("../models/KeywordCategory");
const axios = require("axios");

// Detect category automatically
async function detectCategorySmart(title) {

  const words = title.toLowerCase().split(/\s+/).filter(Boolean);

  // 1️⃣ Check learned memory (optimized)
  const found = await KeywordCategory.findOne({
    keyword: { $in: words }
  });

  if (found) return found.category;

  // 2️⃣ Smart keyword rules
  const rules = {
    food: "Food",
    cloth: "Clothing",
    shirt: "Clothing",
    pant: "Clothing",
    phone: "Mobile",
    mobile: "Mobile",
    bus: "Transport",
    train: "Transport",
    cab: "Transport",
    laptop: "Electronics",
    charger: "Electronics"
  };

  for (let word of words) {
    if (rules[word]) return rules[word];
  }

  return null;
}


// Learn new keywords for future detection
async function learnCategoryFromTitle(title, category) {

  const words = title.toLowerCase().split(/\s+/).filter(Boolean);

  for (let word of words) {
    await KeywordCategory.updateOne(
      { keyword: word },
      { $set: { category } },
      { upsert: true }
    );
  }
}


// Get all expenses
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


// Add new expense
exports.addExpense = async (req, res) => {
  try {

    let category = req.body.category;

    // Try smart detection
    if (!category) {
      category = await detectCategorySmart(req.body.title);
    }

    // Ask user if category still not detected
    if (!category) {
      return res.json({
        needCategory: true,
        title: req.body.title,
        amount: req.body.amount
      });
    }

    // Learn from user input
    if (req.body.category) {
      await learnCategoryFromTitle(req.body.title, category);
    }

    const expense = new Expense({
      title: req.body.title,
      amount: req.body.amount,
      category
    });

    await expense.save();

    res.json(expense);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// Delete expense
exports.deleteExpense = async (req, res) => {
  try {

    const id = req.params.id;

    await Expense.findByIdAndDelete(id);

    res.json({ message: "Expense deleted" });

  } catch (error) {

    res.status(500).json({
      message: "Error deleting expense",
      error: error.message
    });

  }
};


// Update expense
exports.updateExpense = async (req, res) => {
  try {

    const id = req.params.id;

    const updated = await Expense.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (error) {

    res.status(500).json({
      message: "Error updating expense",
      error: error.message
    });

  }
};


// Call ML model for prediction
exports.getPrediction = async (req, res) => {
  try {

    const expenses = req.body.expenses;

    const response = await axios.post(
      "https://smt-expense-analyzer-ml.onrender.com/predict",
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
