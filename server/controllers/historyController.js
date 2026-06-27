const Message = require("../models/Message.js");

async function fetchHistory(req, res) {
  try {
    const messages = await Message.find({ userId: req.userId }).sort({ timestamp: -1 }).limit(100);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { fetchHistory };
