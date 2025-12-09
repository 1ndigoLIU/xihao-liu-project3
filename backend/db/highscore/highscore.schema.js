// db/highscore/highscore.schema.js
// Schema for high score / completion records for Sudoku games.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const highScoreSchema = new Schema({
    // Which game this high score is for
    gameId: {
        type: Schema.Types.ObjectId,
        ref: "SudokuGame",
        required: true,
    },

    // Player name (since we don't have login, just store a string)
    playerName: {
        type: String,
        required: true,
        trim: true,
    },

    // Completion time in seconds
    timeSeconds: {
        type: Number,
        required: true,
        min: 0,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = highScoreSchema;
