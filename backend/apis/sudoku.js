// apis/sudoku.js
// Routes for Sudoku games (list, create, update, delete).

const express = require("express");
const router = express.Router();

const {
    getAllGames,
    // createGame,
    // getGameById,
    // updateGame,
    // deleteGame,
} = require("../db/sudoku/sudoku.model");

// GET /api/sudoku
// Return all sudoku games
router.get("/", async (req, res) => {
    try {
        const games = await getAllGames();
        res.json(games);
    } catch (err) {
        console.error("Error fetching sudoku games:", err);
        res.status(500).json({ error: "Failed to fetch sudoku games" });
    }
});

// TODO: Later we will implement:
// POST /api/sudoku  -> create a new game
// DELETE /api/sudoku/:gameId
// PUT /api/sudoku/:gameId

module.exports = router;
