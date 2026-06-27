const express = require("express");
const { fetchHistory } = require("../controllers/historyController.js");
const { requireAuth } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", requireAuth, fetchHistory);

module.exports = router;
