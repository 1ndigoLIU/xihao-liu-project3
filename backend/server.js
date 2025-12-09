// server.js
// Entry point for the backend server (Sudoku project)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // Load environment variables from .env

const app = express();

// ===== MongoDB connection =====
// Use the connection string from environment variables if available.
// Otherwise fall back to a local MongoDB instance for development.
const mongoDBEndpoint = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sudoku";

mongoose
    .connect(mongoDBEndpoint, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .catch((err) => {
        // This catch is just to log the error early if connect fails
        console.error("Error connecting to MongoDB:", err);
    });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to MongoDB:"));
db.once("open", () => {
    console.log("Successfully connected to MongoDB");
});

// ===== Global middleware =====
app.use(cors()); // Allow cross-origin requests (frontend <-> backend)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies (useful for auth later)

// ===== API routes =====
// const sudokuRoutes = require("./apis/sudoku");
// const userRoutes = require("./apis/user");
// app.use("/api/sudoku", sudokuRoutes);
// app.use("/api/users", userRoutes);

const sudokuRouter = require("./apis/sudoku");
const highscoreRouter = require("./apis/highscore");

app.use("/api/sudoku", sudokuRouter);
app.use("/api/highscore", highscoreRouter);


// Simple health check route to verify backend + DB are working
app.get("/api/health", (req, res) => {
    // mongoose.connection.readyState:
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    res.json({
        status: "ok",
        dbState: mongoose.connection.readyState,
    });
});

// ===== Serve frontend build (for production / Render) =====
// If you are using Vite, the build output is usually in "frontend/dist".
// If you are using Create-React-App, change "dist" to "build".
const frontendDir = path.join(__dirname, "..", "frontend", "dist");

app.use(express.static(frontendDir));

// Catch-all route: for any non-API request, send back index.html
app.get("*", (req, res) => {
    console.log("Received request:", req.method, req.url);
    res.sendFile(path.join(frontendDir, "index.html"));
});

// ===== Start the server =====
const PORT = process.env.PORT || 8000; // Render will provide process.env.PORT
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
