// db/user/user.model.js
// Wraps the schema in a Mongoose model and exposes helper functions.

const mongoose = require("mongoose");
const userSchema = require("./user.schema");

// "User" will be the collection name "users" in MongoDB
const User = mongoose.model("User", userSchema);

// Create a new guest user with auto-generated username and nickname
// Will retry if username already exists (should be very rare)
async function createGuestUser() {
    const { generateGuestUsername } = require("../../utils/guestIdGenerator");
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const username = generateGuestUsername();
        const nickname = username; // Same as username for guests

        // Check if username already exists
        const exists = await User.findOne({ username });
        if (!exists) {
            // Username is unique, create the user
            const user = await User.create({
                username,
                isGuest: true,
                password: null,
                nickname,
            });
            return user;
        }
        attempts++;
    }

    // If we couldn't find a unique username after max attempts, throw error
    throw new Error("Failed to generate unique guest username after multiple attempts");
}

// Get a user by username
async function getUserByUsername(username) {
    return User.findOne({ username });
}

// Get a user by ID
async function getUserById(id) {
    return User.findById(id);
}

// Check if username exists
async function usernameExists(username) {
    const user = await User.findOne({ username });
    return !!user;
}

module.exports = {
    User,
    createGuestUser,
    getUserByUsername,
    getUserById,
    usernameExists,
};

