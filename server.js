require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");

const app = express();
app.use(express.json());

/* -------------------- MongoDB -------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

/* -------------------- Redis -------------------- */

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.log("Redis Error:", err));

(async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log("Redis Connected");
  }
})();

/* -------------------- Schema -------------------- */

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const Todo = mongoose.model("Todo", todoSchema);

/* -------------------- Routes -------------------- */

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.post("/add", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newTodo = await Todo.create({ title });

    // Cache Invalidate
    await client.del("todos");

    res.json(newTodo);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

app.get("/todos", async (req, res) => {
  try {
    const cached = await client.get("todos");

    if (cached) {
      return res.json({
        source: "Redis Cache",
        data: JSON.parse(cached),
      });
    }

    const todos = await Todo.find();

    await client.setEx("todos", 30, JSON.stringify(todos));

    res.json({
      source: "MongoDB",
      data: todos,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

/* -------------------- Local Server -------------------- */

const PORT = process.env.PORT || 3000;

// Only run locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

module.exports = app;