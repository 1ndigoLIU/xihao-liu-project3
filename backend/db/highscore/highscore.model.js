// db/highscore/highscore.model.js
// HighScore model and helper methods.

const mongoose = require("mongoose");
const highScoreSchema = require("./highscore.schema");

const HighScore = mongoose.model("HighScore", highScoreSchema);

// Add a new score record
// data: { gameId, playerId (ObjectId), timeSeconds }
async function addScore({ gameId, playerId, timeSeconds }) {
    const score = await HighScore.create({
        gameId,
        playerId, // Now expects ObjectId, not String
        timeSeconds,
    });
    return score;
}

// Get all scores for a specific game (sorted by time)
// Populate playerId to get user nickname
async function getScoresForGame(gameId) {
    return HighScore.find({ gameId })
        .populate('playerId', 'nickname username')
        .sort({ timeSeconds: 1, createdAt: 1 });
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
    const populatedResults = await HighScore.populate(results, {
        path: "_id",
        model: "SudokuGame",
        populate: {
            path: "createdBy",
            select: "nickname username",
        },
    });

    return populatedResults;
}

module.exports = {
    HighScore,
    addScore,
    getScoresForGame,
    getHighScoreList,
};
