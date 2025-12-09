// db/highscore/highscore.model.js
// HighScore model and helper methods.

const mongoose = require("mongoose");
const highScoreSchema = require("./highscore.schema");

const HighScore = mongoose.model("HighScore", highScoreSchema);

// Add a new score record
// data: { gameId, playerId (ObjectId), timeSeconds }
async function addScore({gameId, playerId, timeSeconds}) {
    const score = await HighScore.create({
        gameId, playerId, // Now expects ObjectId, not String
        timeSeconds,
    });
    return score;
}

// Get all scores for a specific game (sorted by time)
// Populate playerId to get user nickname
async function getScoresForGame(gameId) {
    return HighScore.find({gameId})
        .populate('playerId', 'nickname username')
        .sort({timeSeconds: 1, createdAt: 1});
}

// Check if a specific player has completed a specific game
// Returns the score record if found, null otherwise
async function getPlayerScoreForGame(gameId, playerId) {
    return HighScore.findOne({gameId, playerId})
        .populate('playerId', 'nickname username')
        .sort({timeSeconds: 1, createdAt: 1}); // Get best time if multiple records exist
}

// Update a score record if the new time is better (shorter)
// Returns the updated score record, existing record (if new time is not better), or null (if no record exists)
async function updateScoreIfBetter({gameId, playerId, timeSeconds}) {
    // Find existing record (get best time if multiple records exist)
    const existingScore = await HighScore.findOne({gameId, playerId})
        .sort({timeSeconds: 1, createdAt: 1});

    if (!existingScore) {
        // No existing record, return null (caller should create new one)
        return null;
    }

    // If new time is better (shorter), update the record
    if (timeSeconds < existingScore.timeSeconds) {
        existingScore.timeSeconds = timeSeconds;
        existingScore.createdAt = new Date(); // Update completion time
        await existingScore.save();
        await existingScore.populate('playerId', 'nickname username');
        return existingScore;
    }

    // New time is not better (longer or equal), return existing record (don't create new one)
    await existingScore.populate('playerId', 'nickname username');
    return existingScore;
}

// Get list of games sorted by number of DISTINCT players who completed them
async function getHighScoreList() {
    const SudokuGame = require("../sudoku/sudoku.model").SudokuGame;

    const results = await HighScore.aggregate([{
        // First group by gameId + playerId
        // => one entry per distinct player per game
        $group: {
            _id: {gameId: "$gameId", playerId: "$playerId"}, bestTimePerPlayer: {$min: "$timeSeconds"},
        },
    }, {
        // Then group by gameId only
        // => count distinct players, and get best time among them
        $group: {
            _id: "$_id.gameId", completionCount: {$sum: 1},         // number of distinct players
            bestTime: {$min: "$bestTimePerPlayer"},
        },
    }, // Note: We'll sort after populate since we need difficulty field
    ]);

    // Populate _id (which is gameId here) with SudokuGame document
    // Use SudokuGame.populate for better compatibility with aggregate results
    const populatedResults = await SudokuGame.populate(results, {
        path: "_id", populate: {
            path: "createdBy", select: "nickname username",
        },
    });

    // Sort: 1. completionCount (desc), 2. difficulty (EASY before NORMAL), 3. bestTime (asc)
    populatedResults.sort((a, b) => {
        // First: by completionCount (descending)
        if (b.completionCount !== a.completionCount) {
            return b.completionCount - a.completionCount;
        }

        // Second: by difficulty (EASY before NORMAL)
        const difficultyOrder = {"EASY": 0, "NORMAL": 1};
        const difficultyA = difficultyOrder[a._id?.difficulty] ?? 2;
        const difficultyB = difficultyOrder[b._id?.difficulty] ?? 2;
        if (difficultyA !== difficultyB) {
            return difficultyA - difficultyB;
        }

        // Third: by bestTime (ascending - shorter time is better)
        const timeA = a.bestTime ?? Infinity;
        const timeB = b.bestTime ?? Infinity;
        return timeA - timeB;
    });

    return populatedResults;
}

module.exports = {
    HighScore, addScore, getScoresForGame, getHighScoreList, getPlayerScoreForGame, updateScoreIfBetter,
};
