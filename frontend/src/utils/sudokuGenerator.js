/**
 * Deep copy a 2D array
 */
function deepCopy2DArray(array) {
    return array.map((row) => [...row]);
}

/**
 * Game configuration constants
 */
const GAME_CONFIG = {
    6: { height: 2, width: 3, filledCells: 18 },
    9: { height: 3, width: 3, filledCellsMin: 28, filledCellsMax: 30 },
};

/**
 * Get game configuration for a given size
 */
function getGameConfig(size) {
    const config = GAME_CONFIG[size];
    if (!config) {
        throw new Error(`Unsupported size: ${size}. Only 6 and 9 are supported.`);
    }
    return config;
}

/**
 * Solve Sudoku using backtracking algorithm
 * Returns the number of solutions found (stops at 2 to optimize performance)
 * 
 * Algorithm:
 * 1. Find the first empty cell
 * 2. Try each valid number (1 to size)
 * 3. Recursively solve the rest of the board
 * 4. If a solution is found, increment counter
 * 5. Backtrack by removing the number and try next
 * 6. Stop early if we find more than one solution
 * 
 * @param {Array} board - The Sudoku board (will be modified during solving)
 * @param {number} size - Board size (6 or 9)
 * @param {number} maxSolutions - Maximum number of solutions to find (default: 2)
 * @returns {number} Number of solutions found (0, 1, or 2+)
 */
export function countSolutions(board, size, maxSolutions = 2) {
    let solutionCount = 0;

    function solve() {
        // Find first empty cell
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (board[row][col] === null) {
                    // Try each possible number
                    for (let num = 1; num <= size; num++) {
                        if (isValidPlacement(board, row, col, num, size)) {
                            board[row][col] = num;
                            solve();
                            board[row][col] = null; // Backtrack

                            // Early exit optimization: stop if we found multiple solutions
                            if (solutionCount >= maxSolutions) {
                                return;
                            }
                        }
                    }
                    return; // No valid number found, backtrack
                }
            }
        }
        // Board is completely filled - found a solution
        solutionCount++;
    }

    solve();
    return solutionCount;
}


/**
 * Check if a number can be placed at a given position
 */
export function isValidPlacement(board, row, col, num, size) {
    const { height: subgridRows, width: subgridCols } = getGameConfig(size);

    // Check row
    for (let c = 0; c < size; c++) {
        if (board[row][c] === num && c !== col) {
            return false;
        }
    }

    // Check column
    for (let r = 0; r < size; r++) {
        if (board[r][col] === num && r !== row) {
            return false;
        }
    }

    // Check subgrid
    const subgridRow = Math.floor(row / subgridRows) * subgridRows;
    const subgridCol = Math.floor(col / subgridCols) * subgridCols;

    for (let r = subgridRow; r < subgridRow + subgridRows; r++) {
        for (let c = subgridCol; c < subgridCol + subgridCols; c++) {
            if (board[r][c] === num && (r !== row || c !== col)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Check if a cell value violates Sudoku rules
 */
function isCellValid(board, row, col, size) {
    const value = board[row][col];
    if (value === null || value === '') {
        return true; // Empty cells are valid
    }
    return isValidPlacement(board, row, col, value, size);
}


/**
 * Check if the board is completely filled and valid
 */
export function isBoardComplete(board, size) {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === null || board[r][c] === '') {
                return false;
            }
            if (!isCellValid(board, r, c, size)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Get all invalid cells (for highlighting)
 * Only returns cells that are NOT given cells (i.e., only player-input cells)
 * @param {Array} board - The Sudoku board
 * @param {number} size - Board size (6 or 9)
 * @param {Array} givenCells - Array of [row, col] coordinates for given cells (pre-filled cells)
 * @returns {Array} Array of [row, col] coordinates for invalid player-input cells
 */
export function getInvalidCells(board, size, givenCells = []) {
    const invalid = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Skip given cells - only check player-input cells
            if (givenCells.some(([gr, gc]) => gr === r && gc === c)) {
                continue;
            }
            
            // Check if this player-input cell is invalid
            if (board[r][c] !== null && board[r][c] !== '' && !isCellValid(board, r, c, size)) {
                invalid.push([r, c]);
            }
        }
    }
    return invalid;
}
