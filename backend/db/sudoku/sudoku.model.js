// db/sudoku/sudoku.model.js
// Wraps the schema in a Mongoose model and exposes helper functions.

const mongoose = require("mongoose");
const sudokuSchema = require("./sudoku.schema");

// "SudokuGame" will be the collection name "sudokugames" in MongoDB
const SudokuGame = mongoose.model("SudokuGame", sudokuSchema);

// Create a new game document
async function createGame(gameData) {
    const game = await SudokuGame.create(gameData);
    return game;
}

// Get all games (sorted by createdAt, newest first)
async function getAllGames() {
    return SudokuGame.find().sort({ createdAt: -1 });
}

// Get a single game by its id
async function getGameById(id) {
    return SudokuGame.findById(id);
}

// Update a game by id (for PUT /api/sudoku/:gameId)
async function updateGame(id, updates) {
    return SudokuGame.findByIdAndUpdate(id, updates, { new: true });
}

// Delete a game by id
async function deleteGame(id) {
    return SudokuGame.findByIdAndDelete(id);
}

module.exports = {
    SudokuGame,
    createGame,
    getAllGames,
    getGameById,
    updateGame,
    deleteGame,
};
