// db/sudoku/sudoku.schema.js
// Defines the schema (shape) of a Sudoku game document.

const mongoose = require("mongoose");

const sudokuSchema = new mongoose.Schema({
    // Unique name generated from random words, e.g. "red-coconut-house"
    name: {
        type: String, required: true, unique: true, trim: true,
    },

    // Difficulty level: only EASY or NORMAL (based on project spec)
    difficulty: {
        type: String, enum: ["EASY", "NORMAL"], required: true,
    },

    // Optional: game size, e.g. 6 or 9
    size: {
        type: Number, default: 9,
    },

    // Initial board given to the player (0 or null for empty cells).
    boardInitial: {
        type: [[Number]], // 2D array of numbers
        required: true,
    },

    // Full solution of the board.
    boardSolution: {
        type: [[Number]], required: true,
    },

    // Reference to the user who created this game
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, // Can be null for legacy games
    },

    createdAt: {
        type: Date, default: Date.now,
    },
});

module.exports = sudokuSchema;
