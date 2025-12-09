// apis/highscore.js
// Routes for high score related endpoints.

const express = require("express");
const router = express.Router();

const {
    getHighScoreList,
    getScoresForGame,
    addScore,
    getPlayerScoreForGame,
} = require("../db/highscore/highscore.model");

// GET /api/highscore
// Return list of games sorted by number of distinct players
router.get("/", async (req, res) => {
    try {
        const results = await getHighScoreList();
        res.json(results);
    } catch (err) {
        console.error("Error fetching high scores:", err);
        res.status(500).json({ error: "Failed to fetch high scores" });
    }
});

// GET /api/highscore/:gameId
// Return all score records for a specific game (sorted by time)
// If query param ?playerId is provided, return only that player's score for this game
router.get("/:gameId", async (req, res) => {
    try {
        const { gameId } = req.params;
        const { playerId } = req.query;

        // If playerId is provided, return only that player's score for this game
        if (playerId) {
            const mongoose = require("mongoose");
            let playerObjectId = null;

            if (mongoose.Types.ObjectId.isValid(playerId)) {
                playerObjectId = playerId;
            } else {
                // If it's a username, look up the user
                const { getUserByUsername } = require("../db/user/user.model");
                const user = await getUserByUsername(playerId);
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                playerObjectId = user._id;
            }

            const score = await getPlayerScoreForGame(gameId, playerObjectId);
            if (!score) {
                return res.status(404).json({ error: "Player has not completed this game" });
            }
            return res.json(score);
        }

        // Otherwise, return all scores for this game
        const scores = await getScoresForGame(gameId);
        res.json(scores);
    } catch (err) {
        console.error("Error fetching scores for game:", err);
        res.status(500).json({ error: "Failed to fetch scores for this game" });
    }
});

// POST /api/highscore
// Body: { gameId, playerId (User ObjectId), timeSeconds }
router.post("/", async (req, res) => {
    try {
        const { gameId, playerId, timeSeconds } = req.body;

        if (!gameId || !playerId) {
            return res.status(400).json({
                error: "gameId and playerId are required",
            });
        }

        const parsedTime = Number(timeSeconds);
        if (!Number.isFinite(parsedTime) || parsedTime < 0) {
            return res
                .status(400)
                .json({ error: "timeSeconds must be a non-negative number" });
        }

        // Validate playerId is a valid ObjectId or username
        const mongoose = require("mongoose");
        let playerObjectId = null;

        if (mongoose.Types.ObjectId.isValid(playerId)) {
            // If it's a valid ObjectId, use it directly
            playerObjectId = playerId;
        } else {
            // If it's a username, look up the user
            const { getUserByUsername } = require("../db/user/user.model");
            const user = await getUserByUsername(playerId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            playerObjectId = user._id;
        }

        const score = await addScore({
            gameId,
            playerId: playerObjectId,
            timeSeconds: parsedTime,
        });

        // Populate playerId before returning
        await score.populate('playerId', 'nickname username');

        res.status(201).json(score);
    } catch (err) {
        console.error("Error adding high score:", err);
        res.status(500).json({ error: "Failed to add high score" });
    }
});

module.exports = router;
