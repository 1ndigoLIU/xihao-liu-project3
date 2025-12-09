// db/user/user.schema.js
// Defines the schema (shape) of a User document.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    // Username (unique identifier)
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    // Whether this is a guest user
    isGuest: {
        type: Boolean,
        required: true,
        default: true,
    },

    // Password (only for non-guest users, null for guests)
    password: {
        type: String,
        required: false,
        default: null,
    },

    // Display nickname
    nickname: {
        type: String,
        required: true,
        trim: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster lookups
userSchema.index({ username: 1 });
userSchema.index({ isGuest: 1 });

module.exports = userSchema;

