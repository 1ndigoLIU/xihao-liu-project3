// db/highscore/highscore.model.js
// HighScore model and helper methods.

const mongoose = require("mongoose");
const highScoreSchema = require("./highscore.schema");

const HighScore = mongoose.model("HighScore", highScoreSchema);

// Add a new score record
// data: { gameId, playerId, playerName, timeSeconds }
async function addScore({ gameId, playerId, playerName, timeSeconds }) {
    const score = await HighScore.create({
        gameId,
        playerId,
        playerName,
        timeSeconds,
    });
    return score;
}

// Get all scores for a specific game (raw list, possibly with duplicates)
async function getScoresForGame(gameId) {
    return HighScore.find({ gameId }).sort({ timeSeconds: 1, createdAt: 1 });
}

// Get list of games sorted by number of DISTINCT players who completed them
async function getHighScoreList() {
    const results = await HighScore.aggregate([
        {
            // First group by gameId + playerId
            // => one entry per distinct player per game
            $group: {
                _id: { gameId: "$gameId", playerId: "$playerId" },
                bestTimePerPlayer: { $min: "$timeSeconds" },
            },
        },
        {
            // Then group by gameId only
            // => count distinct players, and get best time among them
            $group: {
                _id: "$_id.gameId",
                completionCount: { $sum: 1 },         // number of distinct players
                bestTime: { $min: "$bestTimePerPlayer" },
            },
        },
        { $sort: { completionCount: -1 } },
    ]);

    // Populate _id (which is gameId here) with SudokuGame document
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
