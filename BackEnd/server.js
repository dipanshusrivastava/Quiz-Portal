require("dotenv").config(); // ✅ MUST BE FIRST LINE

const express = require("express");
const cors = require("cors");

const { sequelize } = require("./models"); // Sequelize connection

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/quiz", require("./routes/quiz"));

// Sync database first, then start server
sequelize
  .sync()
  .then(() => {
    console.log("SQLite database connected");

    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
