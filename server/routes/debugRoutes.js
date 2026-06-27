const express = require("express");
const { chat } = require("../controllers/debugController.js");
const { requireAuth } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/chat", requireAuth, chat);

module.exports = router;
