// utils/gameNameGenerator.js
// Generates unique game names by randomly selecting 3 words from a word list

const words = [
    "Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Pink", "Black", "White", "Gray",
    "Coconut", "Apple", "Banana", "Cherry", "Grape", "Lemon", "Orange", "Peach", "Pear", "Plum",
    "House", "Tree", "River", "Mountain", "Ocean", "Forest", "Desert", "Valley", "Island", "Beach",
    "Sun", "Moon", "Star", "Cloud", "Rain", "Snow", "Wind", "Storm", "Lightning", "Thunder",
    "Lion", "Tiger", "Eagle", "Dolphin", "Wolf", "Bear", "Fox", "Deer", "Rabbit", "Bird",
    "Book", "Pen", "Paper", "Computer", "Phone", "Camera", "Watch", "Clock", "Lamp", "Chair",
    "Fire", "Water", "Earth", "Air", "Stone", "Metal", "Wood", "Glass", "Crystal", "Diamond",
    "City", "Village", "Town", "Street", "Road", "Bridge", "Tower", "Castle", "Palace", "Temple",
    "Music", "Dance", "Art", "Poetry", "Story", "Dream", "Hope", "Love", "Joy", "Peace",
    "Adventure", "Journey", "Quest", "Mission", "Exploration", "Discovery", "Mystery", "Secret", "Puzzle", "Riddle",
    "Ancient", "Modern", "Future", "Past", "Present", "Eternal", "Timeless", "Classic", "New", "Old",
    "Bright", "Dark", "Light", "Shadow", "Glow", "Shine", "Sparkle", "Twinkle", "Flash", "Beam",
    "Silent", "Loud", "Quiet", "Noisy", "Calm", "Stormy", "Peaceful", "Chaotic", "Serene", "Wild",
    "Fast", "Slow", "Quick", "Steady", "Swift", "Rapid", "Gentle", "Smooth", "Rough", "Sharp",
    "Big", "Small", "Tiny", "Huge", "Giant", "Mini", "Large", "Massive", "Enormous", "Micro",
    "Hot", "Cold", "Warm", "Cool", "Freezing", "Boiling", "Mild", "Extreme", "Temperate", "Frigid",
    "Sweet", "Sour", "Bitter", "Salty", "Spicy", "Mild", "Rich", "Plain", "Bland", "Flavorful",
    "Happy", "Sad", "Angry", "Calm", "Excited", "Bored", "Tired", "Energetic", "Relaxed", "Stressed",
    "Strong", "Weak", "Powerful", "Fragile", "Tough", "Soft", "Hard", "Firm", "Flexible", "Rigid",
    "Beautiful", "Ugly", "Pretty", "Plain", "Elegant", "Rough", "Smooth", "Polished", "Raw", "Refined"
];

/**
 * Generate a random game name by selecting 3 random words
 * @returns {string} A game name like "Red Coconut House"
 */
function generateGameName() {
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

