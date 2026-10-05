const mongoose = require("mongoose");

function formatMongoConnectionError(err) {
  return err?.message || "Unknown MongoDB connection error.";
}

async function connectToDatabase(mongoUri) {
  if (process.env.USE_MEMORY_DB === "true") {
    console.log("Using in-memory development database.");
    return;
  }

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in server/.env");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error("MongoDB connection error:", formatMongoConnectionError(err));
    throw err;
  }
}

module.exports = { connectToDatabase };
