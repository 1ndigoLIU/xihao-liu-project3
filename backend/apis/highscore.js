// apis/highscore.js
// Routes for high score related endpoints.

const express = require("express");
const router = express.Router();

const {
    getHighScoreList,
    getScoresForGame,
    addScore,
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
router.get("/:gameId", async (req, res) => {
    try {
        const { gameId } = req.params;
        const scores = await getScoresForGame(gameId);
        res.json(scores);
    } catch (err) {
        console.error("Error fetching scores for game:", err);
        res.status(500).json({ error: "Failed to fetch scores for this game" });
    }
});

// POST /api/highscore
// Body: { gameId, playerId, playerName, timeSeconds }
router.post("/", async (req, res) => {
    try {
        const { gameId, playerId, playerName, timeSeconds } = req.body;

        if (!gameId || !playerId || !playerName) {
            return res.status(400).json({
                error: "gameId, playerId and playerName are required",
            });
        }

        const parsedTime = Number(timeSeconds);
        if (!Number.isFinite(parsedTime) || parsedTime < 0) {
            return res
                .status(400)
                .json({ error: "timeSeconds must be a non-negative number" });
        }

        const score = await addScore({
            gameId,
            playerId,
            playerName,
            timeSeconds: parsedTime,
        });

        res.status(201).json(score);
    } catch (err) {
        console.error("Error adding high score:", err);
        res.status(500).json({ error: "Failed to add high score" });
    }
});

module.exports = router;
