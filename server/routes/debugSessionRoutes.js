const express = require("express");
const {
  fetchDebugHistory,
  getDebugSession,
  startDebugSession,
} = require("../controllers/debugSessionController.js");
const { requireAuth } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/", requireAuth, startDebugSession);
router.get("/history", requireAuth, fetchDebugHistory);
router.get("/:id", requireAuth, getDebugSession);

module.exports = router;
