const express = require("express");
const router = express.Router();

const {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getPrediction
} = require("../controllers/expenseController");

// CRUD Routes
router.post("/", addExpense);
router.get("/", getExpenses);
router.delete("/:id", deleteExpense);
router.put("/:id", updateExpense);

// Prediction
router.post("/predict", getPrediction);

module.exports = router;
