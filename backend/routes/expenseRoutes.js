const express = require("express");
const router = express.Router();

const {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getExpenseSummary,
  getPrediction
} = require("../controllers/expenseController");

// CRUD Routes
router.post("/", addExpense);
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.delete("/:id", deleteExpense);
router.put("/:id", updateExpense);

// Prediction
router.post("/predict", getPrediction);

module.exports = router;
