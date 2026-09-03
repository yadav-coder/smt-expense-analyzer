const mongoose = require("mongoose");

const keywordCategorySchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model(
  "KeywordCategory",
  keywordCategorySchema
);
