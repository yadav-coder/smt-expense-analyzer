const Expense = require("../models/Expense");
const KeywordCategory = require("../models/KeywordCategory");

async function detectCategorySmart(title) {

  const words = title.toLowerCase().split(/\s+/).filter(Boolean);

  // 1) Check learned memory
  for (let word of words) {
    const found = await KeywordCategory.findOne({ keyword: word });
    if (found) return found.category;
  }

  // 2) Smart keyword rules
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

  // IMPORTANT
  return null;
}


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

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching expenses", error: error.message });
  }
};

exports.addExpense = async (req, res) => {
  try {

    let category = req.body.category;
    if (!category) {
      category = await detectCategorySmart(req.body.title);
    }

    if (!category) {
      return res.json({
        needCategory: true,
        title: req.body.title,
        amount: req.body.amount
      });
    }

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
    res.status(500).json({ message: error.message });
  }
};



exports.deleteExpense = async (req, res) => {
  try {
    const id = req.params.id;
    await Expense.findByIdAndDelete(id);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting expense", error: error.message });
  }
};

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
    res.status(500).json({ message: "Error updating expense", error: error.message });
  }
};




exports.getPrediction = async (req, res) => {
  try {
    const axios = require("axios");
    const expenses = req.body.expenses;

const response = await axios.post(
  "https://smt-expense-analyzer-ml.onrender.com/predict",
  { expenses }
);


    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Prediction failed", error: error.message });
  }
};
