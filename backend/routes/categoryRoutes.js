const express = require("express");
const router = express.Router();

const {
  getCategories,
  renameCategory,
  deleteCategory
} = require("../controllers/categoryController");

router.get("/", getCategories);
router.put("/rename", renameCategory);
router.delete("/:name", deleteCategory);

module.exports = router;
