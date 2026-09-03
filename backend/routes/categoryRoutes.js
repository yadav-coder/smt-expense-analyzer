const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");

const {
  getCategories,
  renameCategory,
  deleteCategory
} = require("../controllers/categoryController");

router.use(requireAuth);
router.get("/", getCategories);
router.put("/rename", renameCategory);
router.delete("/:name", deleteCategory);

module.exports = router;
