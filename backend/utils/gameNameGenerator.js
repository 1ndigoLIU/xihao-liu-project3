// utils/gameNameGenerator.js
// Generates unique game names by randomly selecting 3 words from a word list
// Words are loaded from a JSON file for easy maintenance and expansion

const fs = require("fs");
const path = require("path");

// Load words from JSON file once at module load time
// Merge all categories into a single flat array
let words = [];
try {
    const wordsPath = path.join(__dirname, "..", "data", "words.json");
    const wordsData = JSON.parse(fs.readFileSync(wordsPath, "utf8"));
    
    // Combine all categories into a single array
    words = Object.values(wordsData).flat();
    
    // Remove duplicates (in case any word appears in multiple categories)
    words = [...new Set(words)];
    
    if (words.length < 1000) {
        console.warn(`Warning: Word list contains only ${words.length} words. Consider expanding to 1000+ words.`);
    } else {
        console.log(`Loaded ${words.length} unique words from words.json`);
    }
} catch (error) {
    console.error("Error loading words.json:", error);
    // Fallback to a minimal word list if file cannot be loaded
    words = ["Red", "Blue", "Green", "Coconut", "House", "Tree"];
    console.error("Using fallback word list. Please check words.json file.");
}

/**
 * Generate a random game name by selecting 3 random words
 * @returns {string} A game name like "Red Coconut House"
 */
function generateGameName() {
    if (words.length < 3) {
        throw new Error("Word list must contain at least 3 words");
    }
    
    const selectedWords = [];
    const usedIndices = new Set();
    
    // Select 3 unique random words
    while (selectedWords.length < 3) {
        const randomIndex = Math.floor(Math.random() * words.length);
        if (!usedIndices.has(randomIndex)) {
            usedIndices.add(randomIndex);
            selectedWords.push(words[randomIndex]);
        }
    }
    
    return selectedWords.join(" ");
}

module.exports = { generateGameName };

