const express = require("express");
const { signup, login, getCurrentUser } = require("../controllers/authController.js");
const { requireAuth } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/signup", signup);
router.post("/register", signup);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
