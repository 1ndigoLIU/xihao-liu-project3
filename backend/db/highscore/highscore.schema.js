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

    // Unique id for a player (e.g. stored in frontend localStorage)
    // This is NOT the same as display name; it's an internal identifier.
    playerId: {
        type: String,
        required: true,
        trim: true,
    },

    // Player name shown on UI (can be "Guest", etc.)
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

// Optional indexes to speed up common queries / aggregations
highScoreSchema.index({ gameId: 1, playerId: 1 });
highScoreSchema.index({ gameId: 1, timeSeconds: 1 });

module.exports = highScoreSchema;
