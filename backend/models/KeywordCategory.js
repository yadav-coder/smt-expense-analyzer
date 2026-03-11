const mongoose = require("mongoose");

const keywordCategorySchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model(
  "KeywordCategory",
  keywordCategorySchema
);
