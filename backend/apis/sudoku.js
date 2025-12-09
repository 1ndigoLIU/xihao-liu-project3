// apis/sudoku.js
// Routes for Sudoku games (list, create, update, delete).

const express = require("express");
const router = express.Router();

const {
    getAllGames, createGame, getGameById, updateGame, deleteGame,
} = require("../db/sudoku/sudoku.model");

const {getUserByUsername} = require("../db/user/user.model");

const {generatePuzzle, verifyUniqueSolution, solveSudoku, isValidPlacement} = require("../utils/sudokuGenerator");
const {generateGameName} = require("../utils/gameNameGenerator");

// GET /api/sudoku
// Return all sudoku games
router.get("/", async (req, res) => {
    try {
        const games = await getAllGames();
        res.json(games);
    } catch (err) {
        console.error("Error fetching sudoku games:", err);
        res.status(500).json({error: "Failed to fetch sudoku games"});
    }
});

// POST /api/sudoku
// Create a new game
// Request body: { difficulty: "EASY" | "NORMAL", createdByUserId: ObjectId }
router.post("/", async (req, res) => {
    try {
        const {difficulty, createdByUserId} = req.body;

        if (!difficulty || (difficulty !== "EASY" && difficulty !== "NORMAL")) {
            return res.status(400).json({error: "Difficulty must be EASY or NORMAL"});
        }

        // Check MongoDB connection
        const mongoose = require("mongoose");
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({error: "Database not connected. Please check MongoDB connection."});
        }

        // Determine size based on difficulty
        const size = difficulty === "EASY" ? 6 : 9;

        // Generate puzzle
        let puzzle, solution;
        try {
            const result = generatePuzzle(size);
            puzzle = result.puzzle;
            solution = result.solution;
        } catch (genError) {
            console.error("Error generating puzzle:", genError);
            return res.status(500).json({error: "Failed to generate puzzle: " + genError.message});
        }

        if (!puzzle || !solution) {
            return res.status(500).json({error: "Failed to generate puzzle: Invalid puzzle data"});
        }

        // Convert null to 0 for MongoDB (schema expects Number, not null)
        const boardInitial = puzzle.map(row => row.map(cell => cell === null ? 0 : cell));

        // Generate unique game name
        let gameName = generateGameName();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure name is unique (retry if needed)
        while (attempts < maxAttempts) {
            try {
                const existingGame = await require("../db/sudoku/sudoku.model").SudokuGame.findOne({name: gameName});
                if (!existingGame) {
                    break; // Name is unique
                }
                gameName = generateGameName();
                attempts++;
            } catch (err) {
                // If error, try again
                gameName = generateGameName();
                attempts++;
            }
        }

        // Get user ID for createdBy
        let createdBy = null;
        if (createdByUserId) {
            // Validate that user exists
            const mongoose = require("mongoose");
            if (mongoose.Types.ObjectId.isValid(createdByUserId)) {
                // If it's a valid ObjectId, use it directly
                const {getUserById} = require("../db/user/user.model");
                const user = await getUserById(createdByUserId);
                if (user) {
                    createdBy = user._id;
                }
            } else {
                // If it's not a valid ObjectId, treat it as username and look up
                const user = await getUserByUsername(createdByUserId);
                if (user) {
                    createdBy = user._id;
                }
            }
        }

        // Create game data
        const gameData = {
            name: gameName,
            difficulty: difficulty,
            size: size,
            boardInitial: boardInitial,
            boardSolution: solution,
            createdBy: createdBy, // ObjectId reference to User
        };

        let newGame;
        try {
            newGame = await createGame(gameData);
        } catch (dbError) {
            console.error("Database error creating game:", dbError);
            // Check if it's a duplicate name error
            if (dbError.code === 11000 || dbError.name === 'MongoServerError') {
                return res.status(409).json({error: "Game name already exists. Please try again."});
            }
            throw dbError; // Re-throw to be caught by outer catch
        }

        res.status(201).json({
            id: newGame._id, name: newGame.name, difficulty: newGame.difficulty,
        });
    } catch (err) {
        console.error("Error creating sudoku game:", err);
        console.error("Error stack:", err.stack);
        // Send more detailed error message in development
        const errorMessage = process.env.NODE_ENV === 'development' ? (err.message || "Failed to create sudoku game") : "Failed to create sudoku game";
        res.status(500).json({error: errorMessage});
    }
});

// POST /api/sudoku/custom
// Create a custom game from user-provided board
// Request body: { board: [[Number]], createdByUserId: ObjectId }
router.post("/custom", async (req, res) => {
    try {
        const {board, createdByUserId} = req.body;

        if (!board || !Array.isArray(board)) {
            return res.status(400).json({error: "Board is required and must be an array"});
        }

        const SIZE = 9;

        // Validate board dimensions
        if (board.length !== SIZE) {
            return res.status(400).json({error: `Board must be ${SIZE}x${SIZE}`});
        }

        for (let i = 0; i < board.length; i++) {
            if (!Array.isArray(board[i]) || board[i].length !== SIZE) {
                return res.status(400).json({error: `Board must be ${SIZE}x${SIZE}`});
            }
        }

        // Convert board: 0 -> null for validation, keep numbers as-is
        const puzzleBoard = board.map(row => row.map(cell => cell === 0 ? null : cell));

        // Validate that the board doesn't have obvious conflicts
        // (This is a basic check - verifyUniqueSolution will do the full validation)
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const value = puzzleBoard[row][col];
                if (value !== null && value !== 0) {
                    // Check if this placement is valid
                    const tempBoard = puzzleBoard.map(r => [...r]);
                    tempBoard[row][col] = null; // Temporarily remove to check
                    if (!isValidPlacement(tempBoard, row, col, value, SIZE)) {
                        return res.status(400).json({
                            error: "Invalid Sudoku: The board contains conflicts (duplicate numbers in row, column, or subgrid)"
                        });
                    }
                }
            }
        }

        // Check if puzzle has exactly one solution
        if (!verifyUniqueSolution(puzzleBoard, SIZE)) {
            return res.status(400).json({
                error: "Invalid Sudoku: The puzzle must have exactly one valid solution. Please add or remove some numbers."
            });
        }

        // Solve the puzzle to get the solution
        const solution = solveSudoku(puzzleBoard, SIZE);
        if (!solution) {
            return res.status(400).json({
                error: "Invalid Sudoku: The puzzle has no solution"
            });
        }

        // Check MongoDB connection
        const mongoose = require("mongoose");
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({error: "Database not connected. Please check MongoDB connection."});
        }

        // Generate unique game name
        let gameName = generateGameName();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure name is unique (retry if needed)
        while (attempts < maxAttempts) {
            try {
                const existingGame = await require("../db/sudoku/sudoku.model").SudokuGame.findOne({name: gameName});
                if (!existingGame) {
                    break; // Name is unique
                }
                gameName = generateGameName();
                attempts++;
            } catch (err) {
                // If error, try again
                gameName = generateGameName();
                attempts++;
            }
        }

        // Get user ID for createdBy
        let createdBy = null;
        if (createdByUserId) {
            // Validate that user exists
            if (mongoose.Types.ObjectId.isValid(createdByUserId)) {
                // If it's a valid ObjectId, use it directly
                const {getUserById} = require("../db/user/user.model");
                const user = await getUserById(createdByUserId);
                if (user) {
                    createdBy = user._id;
                }
            } else {
                // If it's not a valid ObjectId, treat it as username and look up
                const user = await getUserByUsername(createdByUserId);
                if (user) {
                    createdBy = user._id;
                }
            }
        }

        // Convert board to format for MongoDB (null -> 0)
        const boardInitial = board.map(row => row.map(cell => cell === 0 ? 0 : cell));

        // Create game data
        const gameData = {
            name: gameName, difficulty: "NORMAL", // Custom games are always 9x9, so NORMAL
            size: SIZE, boardInitial: boardInitial, boardSolution: solution, createdBy: createdBy, // ObjectId reference to User
        };

        let newGame;
        try {
            newGame = await createGame(gameData);
        } catch (dbError) {
            console.error("Database error creating custom game:", dbError);
            // Check if it's a duplicate name error
            if (dbError.code === 11000 || dbError.name === 'MongoServerError') {
                return res.status(409).json({error: "Game name already exists. Please try again."});
            }
            throw dbError; // Re-throw to be caught by outer catch
        }

        res.status(201).json({
            id: newGame._id, name: newGame.name, difficulty: newGame.difficulty,
        });
    } catch (err) {
        console.error("Error creating custom sudoku game:", err);
        console.error("Error stack:", err.stack);
        // Send more detailed error message in development
        const errorMessage = process.env.NODE_ENV === 'development' ? (err.message || "Failed to create custom sudoku game") : "Failed to create custom sudoku game";
        res.status(500).json({error: errorMessage});
    }
});

// GET /api/sudoku/:gameId
// Get a single game by ID
router.get("/:gameId", async (req, res) => {
    try {
        const game = await getGameById(req.params.gameId);
        if (!game) {
            return res.status(404).json({error: "Game not found"});
        }
        res.json(game);
    } catch (err) {
        console.error("Error fetching sudoku game:", err);
        res.status(500).json({error: "Failed to fetch sudoku game"});
    }
});

// PUT /api/sudoku/:gameId
// Update a game by ID
router.put("/:gameId", async (req, res) => {
    try {
        const updatedGame = await updateGame(req.params.gameId, req.body);
        if (!updatedGame) {
            return res.status(404).json({error: "Game not found"});
        }
        res.json(updatedGame);
    } catch (err) {
        console.error("Error updating sudoku game:", err);
        res.status(500).json({error: "Failed to update sudoku game"});
    }
});

// DELETE /api/sudoku/:gameId
// Delete a game by ID
router.delete("/:gameId", async (req, res) => {
    try {
        const deletedGame = await deleteGame(req.params.gameId);
        if (!deletedGame) {
            return res.status(404).json({error: "Game not found"});
        }
        res.json({message: "Game deleted successfully", game: deletedGame});
    } catch (err) {
        console.error("Error deleting sudoku game:", err);
        res.status(500).json({error: "Failed to delete sudoku game"});
    }
});

module.exports = router;
