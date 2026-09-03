const KeywordCategory = require("../models/KeywordCategory");
const Expense = require("../models/Expense");

function normalizeName(value) {
  return String(value || "").trim();
}

exports.getCategories = async (req, res) => {
  try {
    const learnedCategories = await KeywordCategory.distinct("category");
    const expenseCategories = await Expense.distinct("category", { user: req.user.id });
    const categories = [...new Set([...learnedCategories, ...expenseCategories])]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message
    });
  }
};

exports.renameCategory = async (req, res) => {
  try {
    const oldName = normalizeName(req.body.oldName);
    const newName = normalizeName(req.body.newName);

    if (!oldName || !newName) {
      return res.status(400).json({ message: "Old and new category names are required" });
    }

    await Promise.all([
      KeywordCategory.updateMany(
        { category: oldName },
        { $set: { category: newName } }
      ),
      Expense.updateMany(
        { user: req.user.id, category: oldName },
        { $set: { category: newName } }
      )
    ]);

    res.json({ message: "Category renamed" });
  } catch (error) {
    res.status(500).json({
      message: "Error renaming category",
      error: error.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const name = normalizeName(req.params.name);

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    await Promise.all([
      KeywordCategory.deleteMany({ category: name }),
      Expense.updateMany(
        { user: req.user.id, category: name },
        { $set: { category: "Other" } }
      )
    ]);

    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting category",
      error: error.message
    });
  }
};
