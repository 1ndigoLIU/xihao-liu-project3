// apis/user.js
// Routes for User management (guest user creation).

const express = require("express");
const router = express.Router();

const {
    createGuestUser, getUserByUsername, getUserById, usernameExists,
} = require("../db/user/user.model");

// POST /api/user/guest
// Create a new guest user
// No request body required - username and nickname are auto-generated
router.post("/guest", async (req, res) => {
    try {
        // Create guest user with auto-generated username and nickname
        const user = await createGuestUser();

        res.status(201).json({
            id: user._id, username: user.username, nickname: user.nickname, isGuest: user.isGuest,
        });
    } catch (err) {
        console.error("Error creating guest user:", err);
        res.status(500).json({error: "Failed to create guest user"});
    }
});

// GET /api/user/id/:id
// Get user by ID (MongoDB ObjectId)
router.get("/id/:id", async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        res.json({
            id: user._id, username: user.username, nickname: user.nickname, isGuest: user.isGuest,
        });
    } catch (err) {
        console.error("Error fetching user by ID:", err);
        // If ID format is invalid, return 400 instead of 500
        if (err.name === "CastError") {
            return res.status(400).json({error: "Invalid user ID format"});
        }
        res.status(500).json({error: "Failed to fetch user"});
    }
});

// GET /api/user/:username
// Get user by username
// Note: This route must come after /id/:id to avoid conflicts
router.get("/:username", async (req, res) => {
    try {
        const user = await getUserByUsername(req.params.username);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        res.json({
            id: user._id, username: user.username, nickname: user.nickname, isGuest: user.isGuest,
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({error: "Failed to fetch user"});
    }
});

module.exports = router;

