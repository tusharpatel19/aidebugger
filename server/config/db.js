const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

function formatMongoConnectionError(err) {
  if (err?.syscall === "querySrv" && err?.hostname) {
    return [
      `MongoDB SRV lookup failed for ${err.hostname}.`,
      "Your code and URI format look fine, but this machine cannot resolve the Atlas DNS record.",
      "Try switching your DNS server, flushing DNS cache, or using a non-SRV Atlas connection string.",
    ].join(" ");
  }

  return err?.message || "Unknown MongoDB connection error.";
}

async function connectToDatabase(mongoUri) {
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
