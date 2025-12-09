// utils/guestIdGenerator.js
// Generates a random 5-character alphanumeric ID for guest users

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a random 5-character alphanumeric ID
 * @returns {string} 5-character random ID (e.g., "a3B9x")
 */
function generateGuestId() {
    let id = '';
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * ALPHANUMERIC.length);
        id += ALPHANUMERIC[randomIndex];
    }
    return id;
}

/**
 * Generate a unique guest username and nickname
 * Format: Guest_{5-character-id}
 * @returns {string} Guest username/nickname (e.g., "Guest_a3B9x")
 */
function generateGuestUsername() {
    const id = generateGuestId();
    return `Guest_${id}`;
}

module.exports = {generateGuestId, generateGuestUsername};

