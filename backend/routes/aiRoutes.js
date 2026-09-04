const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const { chat } = require("../controllers/aiController");

const router = express.Router();

router.use(requireAuth);
router.post("/chat", chat);

module.exports = router;
