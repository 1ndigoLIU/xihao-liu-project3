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
// Return list of games sorted by completion count
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
router.post("/", async (req, res) => {
    try {
        const { gameId, playerName, timeSeconds } = req.body;
        const score = await addScore({ gameId, playerName, timeSeconds });
        res.status(201).json(score);
    } catch (err) {
        console.error("Error adding high score:", err);
        res.status(500).json({ error: "Failed to add high score" });
    }
});

module.exports = router;
