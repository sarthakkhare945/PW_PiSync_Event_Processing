const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const syncRoutes = require("./routes/syncRoutes");

dotenv.config();
const app = express();

// ✅ Handle form-data
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Also accept JSON if needed

app.use("/api", syncRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = app;
