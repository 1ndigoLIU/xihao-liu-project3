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

    // Reference to the user who completed this game
    playerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
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
highScoreSchema.index({ playerId: 1 }); // Index for player lookups

module.exports = highScoreSchema;
