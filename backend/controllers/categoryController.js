const KeywordCategory = require("../models/KeywordCategory");

// Get all categories
exports.getCategories = async (req, res) => {
  const categories = await KeywordCategory.distinct("category");
  res.json(categories);
};

// Rename category
exports.renameCategory = async (req, res) => {
  const { oldName, newName } = req.body;

  await KeywordCategory.updateMany(
    { category: oldName },
    { $set: { category: newName } }
  );

  res.json({ message: "Category renamed" });
};

// Delete category
exports.deleteCategory = async (req, res) => {
  const { name } = req.params;

  await KeywordCategory.deleteMany({ category: name });

  res.json({ message: "Category deleted" });
};
