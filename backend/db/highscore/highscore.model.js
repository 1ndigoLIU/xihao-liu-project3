// db/highscore/highscore.model.js
// HighScore model and helper methods.

const mongoose = require("mongoose");
const highScoreSchema = require("./highscore.schema");

const HighScore = mongoose.model("HighScore", highScoreSchema);

// Add a new score (or later you can update existing score logic here)
async function addScore({ gameId, playerName, timeSeconds }) {
    const score = await HighScore.create({ gameId, playerName, timeSeconds });
    return score;
}

// Get all scores for a specific game
async function getScoresForGame(gameId) {
    return HighScore.find({ gameId }).sort({ timeSeconds: 1 });
}

// Get list of games sorted by number of completions (for GET /api/highscore)
async function getHighScoreList() {
    // Aggregate: count how many scores each game has
    const results = await HighScore.aggregate([
        {
            $group: {
                _id: "$gameId",
                completionCount: { $sum: 1 },
                bestTime: { $min: "$timeSeconds" },
            },
        },
        { $sort: { completionCount: -1 } },
    ]);

    // Optionally populate game info
    return HighScore.populate(results, {
        path: "_id",
        model: "SudokuGame",
    });
}

module.exports = {
    HighScore,
    addScore,
    getScoresForGame,
    getHighScoreList,
};
