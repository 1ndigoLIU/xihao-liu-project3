// utils/sudokuGenerator.js
// Backend version of Sudoku puzzle generation

/**
 * Fisher–Yates shuffle
 */
function shuffle(array) {
    const tempArr = array.slice();
    for (let i = tempArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempArr[i], tempArr[j]] = [tempArr[j], tempArr[i]];
    }
    return tempArr;
}

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
 * Build standard solved grid using formula pattern
 */
function buildStandardGrid(size, height, width) {
    return Array.from({ length: size }, (_, row) =>
        Array.from(
            { length: size },
            (_, col) =>
                (((row % height) * width + Math.floor(row / height) + col) % size) + 1
        )
    );
}

/**
 * Shuffle rows within row groups
 */
function shuffleRows(size, height, width) {
    const rowGroups = shuffle(Array.from({ length: width }, (_, group) => group));
    const rowsOrder = [];
    for (const group of rowGroups) {
        const rowsInGroup = shuffle(
            Array.from({ length: height }, (_, i) => group * height + i)
        );
        rowsOrder.push(...rowsInGroup);
    }
    return rowsOrder;
}

/**
 * Shuffle columns within column groups
 */
function shuffleColumns(size, height, width) {
    const colGroups = shuffle(Array.from({ length: height }, (_, group) => group));
    const colsOrder = [];
    for (const group of colGroups) {
        const colsInGroup = shuffle(
            Array.from({ length: width }, (_, j) => group * width + j)
        );
        colsOrder.push(...colsInGroup);
    }
    return colsOrder;
}

/**
 * Build solved Sudoku
 */
function buildSolvedSudoku(size, height, width) {
    const standardGrid = buildStandardGrid(size, height, width);
    const rowsOrder = shuffleRows(size, height, width);
    const colsOrder = shuffleColumns(size, height, width);

    return rowsOrder.map((row) =>
        colsOrder.map((col) => standardGrid[row][col])
    );
}

/**
 * Check if a number can be placed at a given position
 */
function isValidPlacement(board, row, col, num, size) {
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
 * Count solutions using backtracking (stops at 2 for optimization)
 */
function countSolutions(board, size, maxSolutions = 2) {
    let solutionCount = 0;

    function solve() {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (board[row][col] === null || board[row][col] === 0) {
                    for (let num = 1; num <= size; num++) {
                        if (isValidPlacement(board, row, col, num, size)) {
                            board[row][col] = num;
                            solve();
                            board[row][col] = null;

                            if (solutionCount >= maxSolutions) {
                                return;
                            }
                        }
                    }
                    return;
                }
            }
        }
        solutionCount++;
    }

    solve();
    return solutionCount;
}

/**
 * Generate puzzle using backtracking to ensure unique solution
 */
function generatePuzzleWithBacktracking(solvedSudoku, size, filledCellsNumber) {
    const total = size * size;
    const targetRemoved = Math.max(0, total - filledCellsNumber);
    
    const puzzleBoard = deepCopy2DArray(solvedSudoku);
    const coordinates = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            coordinates.push([i, j]);
        }
    }
    const shuffledCoords = shuffle(coordinates);
    
    let removed = 0;
    let attempts = 0;
    const maxAttempts = shuffledCoords.length * 3;

    for (const [row, col] of shuffledCoords) {
        if (removed >= targetRemoved) break;
        if (attempts >= maxAttempts) break;

        const originalValue = puzzleBoard[row][col];
        puzzleBoard[row][col] = null;
        
        const solutions = countSolutions(deepCopy2DArray(puzzleBoard), size, 2);
        
        if (solutions === 1) {
            removed++;
        } else {
            puzzleBoard[row][col] = originalValue;
        }
        
        attempts++;
    }

    return puzzleBoard;
}

/**
 * Verify that a puzzle has exactly one solution
 */
function verifyUniqueSolution(puzzle, size) {
    const solutions = countSolutions(deepCopy2DArray(puzzle), size, 2);
    return solutions === 1;
}

/**
 * Generate a new Sudoku puzzle
 * @param {number} size - 6 for easy, 9 for normal
 * @returns {Object} { puzzle, solution }
 */
function generatePuzzle(size) {
    const config = getGameConfig(size);
    const { height, width } = config;
    
    const filledCellsNumber = size === 6
        ? config.filledCells
        : config.filledCellsMin + Math.floor(Math.random() * (config.filledCellsMax - config.filledCellsMin + 1));

    const solved = buildSolvedSudoku(size, height, width);
    let puzzle = generatePuzzleWithBacktracking(solved, size, filledCellsNumber);

    // Verify and retry if needed
    if (!verifyUniqueSolution(puzzle, size)) {
        console.warn('Generated puzzle does not have unique solution, regenerating...');
        const retryPuzzle = generatePuzzleWithBacktracking(solved, size, filledCellsNumber);
        if (verifyUniqueSolution(retryPuzzle, size)) {
            puzzle = retryPuzzle;
        } else {
            console.error('Failed to generate puzzle with unique solution after retry, using original puzzle');
            // Still return the puzzle even if verification fails (shouldn't happen with correct implementation)
        }
    }

    return { puzzle, solution: solved };
}

module.exports = { generatePuzzle };

