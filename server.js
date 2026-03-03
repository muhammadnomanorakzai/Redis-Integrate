require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* -------------------- MongoDB Connection -------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

/* -------------------- Todo Schema -------------------- */

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const Todo = mongoose.model("Todo", todoSchema);

/* -------------------- Redis Connection -------------------- */

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.log(" Redis Error:", err);
});

(async () => {
  await client.connect();
  console.log(" Redis Connected");
})();

/* -------------------- Routes -------------------- */

/* Add Todo */
app.post("/add", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newTodo = await Todo.create({ title });

    // Cache Invalidate
    await client.del("todos");

    res.json({
      message: "Todo Added & Cache Cleared",
      data: newTodo,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

/* Get Todos (With Redis Cache) */
app.get("/todos", async (req, res) => {
  try {
    const cachedTodos = await client.get("todos");

    if (cachedTodos) {
      return res.json({
        source: "Redis Cache",
        data: JSON.parse(cachedTodos),
      });
    }

    const todos = await Todo.find();

    // Store in Redis for 30 seconds
    await client.setEx("todos", 30, JSON.stringify(todos));

    res.json({
      source: "MongoDB Atlas",
      data: todos,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

//  Start Server 

app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});