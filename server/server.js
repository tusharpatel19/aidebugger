const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectToDatabase } = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const debugRoutes = require("./routes/debugRoutes.js");
const historyRoutes = require("./routes/historyRoutes.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/debugger", debugRoutes);
app.use("/api/messages", historyRoutes);

app.get("/", (req, res) => {
  res.send({ status: "ok", message: "MERN AI Debugger backend is running." });
});

async function startServer() {
  try {
    await connectToDatabase(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();
