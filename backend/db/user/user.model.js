// db/user/user.model.js
// Wraps the schema in a Mongoose model and exposes helper functions.

const mongoose = require("mongoose");
const userSchema = require("./user.schema");

// "User" will be the collection name "users" in MongoDB
const User = mongoose.model("User", userSchema);

// Create a new guest user with auto-generated username and nickname
// Will retry if username already exists (should be very rare)
// Handles race conditions by catching duplicate key errors from MongoDB
async function createGuestUser() {
    const { generateGuestUsername } = require("../../utils/guestIdGenerator");
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const username = generateGuestUsername();
        const nickname = username; // Same as username for guests

        try {
            // Check if username already exists (optimization to avoid unnecessary create attempts)
            const exists = await User.findOne({ username });
            if (exists) {
                attempts++;
                continue; // Username exists, try again
            }

            // Attempt to create the user
            // Note: Even if findOne returned null, there's a race condition window
            // where another request might create the same username between findOne and create.
            // MongoDB's unique constraint will catch this, and we'll retry.
            const user = await User.create({
                username,
                isGuest: true,
                password: null,
                nickname,
            });
            return user;
        } catch (error) {
            // Handle duplicate key error (MongoDB error code 11000)
            // This can happen due to race conditions even if findOne returned null
            if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
                attempts++;
                // Username already exists (race condition or collision), try again
                continue;
            }
            // For other errors, re-throw immediately
            throw error;
        }
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

