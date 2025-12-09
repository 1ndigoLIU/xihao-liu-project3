import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isBoardComplete, getInvalidCells } from '../utils/sudokuGenerator';
import { findHintCell } from '../utils/hintUtils';
import { saveGameState, loadGameState, clearGameState } from '../utils/localStorageUtils';

const SudokuContext = createContext();

// Action types
const ACTIONS = {
    SET_BOARD: 'SET_BOARD',
    UPDATE_CELL: 'UPDATE_CELL',
    SET_SELECTED_CELL: 'SET_SELECTED_CELL',
    NEW_GAME: 'NEW_GAME',
    RESET_GAME: 'RESET_GAME',
    SET_GAME_SIZE: 'SET_GAME_SIZE',
    TICK_TIMER: 'TICK_TIMER',
    RESET_TIMER: 'RESET_TIMER',
    SET_GAME_COMPLETE: 'SET_GAME_COMPLETE',
    SHOW_HINT: 'SHOW_HINT',
    CLEAR_HINT: 'CLEAR_HINT',
    LOAD_GAME_STATE: 'LOAD_GAME_STATE',
    LOAD_GAME_FROM_API: 'LOAD_GAME_FROM_API',
};

// Initial state
const initialState = {
    board: null,
    solution: null,
    givenCells: [],
    size: 9,
    selectedCell: null,
    invalidCells: [],
    isComplete: false,
    timer: 0, // in seconds
    isTimerRunning: false,
    hintCell: null, // [row, col] or null
};

// Reducer
function sudokuReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_GAME_SIZE:
            return {
                ...state,
                size: action.payload,
            };

        case ACTIONS.NEW_GAME: {
            // NEW_GAME action is no longer used - all games are loaded from API
            // This action is kept for compatibility but should not be called
            console.warn('NEW_GAME action called but games should be loaded from API');
            return state;
        }

        case ACTIONS.RESET_GAME: {
            // Reset board to initial puzzle state (only given cells filled)
            const resetBoard = state.board.map(row => row.map(() => null));
            if (state.solution) {
                state.givenCells.forEach(([r, c]) => {
                    resetBoard[r][c] = state.solution[r][c];
                });
            }
            
            return {
                ...state,
                board: resetBoard,
                selectedCell: null,
                invalidCells: [],
                isComplete: false,
                timer: 0,
                isTimerRunning: true,
                hintCell: null,
            };
        }

        case ACTIONS.SET_BOARD:
            return {
                ...state,
                board: action.payload,
            };

        case ACTIONS.UPDATE_CELL: {
            const { row, col, value } = action.payload;
            const newBoard = state.board.map(r => [...r]);
            
            // Only allow numbers in valid range
            if (value === '' || value === null) {
                newBoard[row][col] = null;
            } else {
                const num = parseInt(value, 10);
                if (!isNaN(num) && num >= 1 && num <= state.size) {
                    newBoard[row][col] = num;
                } else {
                    // Invalid number, don't update
                    return state;
                }
            }

            // Check for invalid cells (only player-input cells, not given cells)
            const invalidCells = getInvalidCells(newBoard, state.size, state.givenCells);
            
            // Check if complete
            const isComplete = isBoardComplete(newBoard, state.size);

            return {
                ...state,
                board: newBoard,
                invalidCells,
                isComplete,
                isTimerRunning: !isComplete, // Stop timer when complete
            };
        }

        case ACTIONS.SET_SELECTED_CELL:
            return {
                ...state,
                selectedCell: action.payload,
            };

        case ACTIONS.TICK_TIMER:
            return {
                ...state,
                timer: state.timer + 1,
            };

        case ACTIONS.RESET_TIMER:
            return {
                ...state,
                timer: 0,
            };

        case ACTIONS.SET_GAME_COMPLETE:
            return {
                ...state,
                isComplete: true,
                isTimerRunning: false,
            };

        case ACTIONS.SHOW_HINT:
            return {
                ...state,
                hintCell: action.payload,
            };

        case ACTIONS.CLEAR_HINT:
            return {
                ...state,
                hintCell: null,
            };

        case ACTIONS.LOAD_GAME_STATE:
            return {
                ...state,
                ...action.payload,
                hintCell: null, // Always clear hint when loading saved state
            };

        case ACTIONS.LOAD_GAME_FROM_API: {
            const { boardInitial, boardSolution, size } = action.payload;
            // Convert boardInitial to givenCells format
            const givenCells = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (boardInitial[r][c] !== null && boardInitial[r][c] !== 0) {
                        givenCells.push([r, c]);
                    }
                }
            }
            // Convert 0s to nulls in boardInitial
            const puzzle = boardInitial.map(row => row.map(cell => cell === 0 ? null : cell));
            
            return {
                ...state,
                board: puzzle,
                solution: boardSolution,
                givenCells,
                size,
                selectedCell: null,
                invalidCells: [],
                isComplete: false,
                timer: 0,
                isTimerRunning: true,
                hintCell: null,
            };
        }

        default:
            return state;
    }
}

// Provider component
export function SudokuProvider({ children }) {
    const [state, dispatch] = useReducer(sudokuReducer, initialState);
    const location = useLocation();
    const timerIntervalRef = useRef(null);
    const isInitialMount = useRef(true);
    const lastSaveTimeRef = useRef(0);
    const justLoadedRef = useRef(false); // Track if we just loaded state to prevent immediate save
    const SAVE_DEBOUNCE_MS = 500; // Save at most once per 500ms to avoid excessive writes
    
    // Check if we're on a game page
    // Only /game/:gameId routes are game pages (size will be determined from API data)
    const isGamePage = location.pathname.startsWith('/game/');
    const expectedSize = null; // Size is determined from API data for /game/:gameId routes

    // Clear game state when leaving game pages
    useEffect(() => {
        if (!isGamePage && state.board) {
            // Clear board state when leaving game pages
            dispatch({ type: ACTIONS.SET_BOARD, payload: null });
            dispatch({ type: ACTIONS.SET_SELECTED_CELL, payload: null });
            dispatch({ type: ACTIONS.CLEAR_HINT });
        }
    }, [isGamePage, state.board]);

    // Note: Saved game state loading is disabled for /game/:gameId routes
    // These games are loaded from API and should not use localStorage

    // Timer effect
    useEffect(() => {
        if (state.isTimerRunning && !state.isComplete) {
            timerIntervalRef.current = setInterval(() => {
                dispatch({ type: ACTIONS.TICK_TIMER });
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [state.isTimerRunning, state.isComplete]);

    // Save game state to localStorage after each action
    // Skip saving on initial mount to avoid overwriting with default state
    // Don't save for /game/:gameId routes (those are loaded from API, not localStorage)
    useEffect(() => {
        // Only save if we're on a game page, but NOT on /game/:gameId routes
        // Note: All /game/:gameId routes should not save to localStorage
        if (!isGamePage) {
            return;
        }

        // Don't save if we just loaded state (to prevent immediate re-save)
        if (justLoadedRef.current) {
            return;
        }

        // Don't save if this is the initial mount and we haven't loaded a saved state yet
        if (isInitialMount.current) {
            // If we have a board, mark initial mount as complete so future saves work
            if (state.board) {
                isInitialMount.current = false;
            } else {
                return;
            }
        }

        // Only save if size is valid (6 or 9) - prevents saving when not on game pages
        if (state.size !== 6 && state.size !== 9) {
            return;
        }

        // Clear localStorage when game is complete
        if (state.isComplete && state.board) {
            clearGameState(state.size);
            return;
        }

        // Save game state if board exists
        if (state.board) {
            saveGameState(state, state.size);
        }
    }, [
        state.board,
        state.solution,
        state.givenCells,
        state.size,
        state.selectedCell,
        state.invalidCells,
        state.isComplete,
        isGamePage,
        location.pathname,
        // hintCell is not saved - hints should not persist across sessions
        // Timer is handled separately with debouncing
    ]);

    // Save timer separately with debouncing (to avoid excessive localStorage writes)
    // Don't save for /game/:gameId routes (those are loaded from API, not localStorage)
    useEffect(() => {
        // Only save if we're on a game page, but NOT on /game/:gameId routes
        // Note: All /game/:gameId routes should not save to localStorage
        if (!isGamePage) {
            return;
        }

        // Don't save if we just loaded state
        if (justLoadedRef.current || isInitialMount.current || !state.board || state.isComplete) {
            return;
        }

        // Only save if size is valid (6 or 9)
        if (state.size !== 6 && state.size !== 9) {
            return;
        }

        const now = Date.now();
        // Only save timer if enough time has passed since last save
        if ((now - lastSaveTimeRef.current) >= SAVE_DEBOUNCE_MS) {
            saveGameState(state, state.size);
            lastSaveTimeRef.current = now;
        }
    }, [state.timer, state.board, state.isComplete, state.size, isGamePage, location.pathname]);

    // Actions
    const actions = {
        setGameSize: (size) => {
            dispatch({ type: ACTIONS.SET_GAME_SIZE, payload: size });
        },

        newGame: () => {
            // Clear localStorage when starting a new game
            clearGameState(state.size);
            dispatch({ type: ACTIONS.NEW_GAME });
        },

        resetGame: () => {
            // Clear localStorage when resetting game
            clearGameState(state.size);
            dispatch({ type: ACTIONS.RESET_GAME });
        },

        updateCell: (row, col, value) => {
            dispatch({ type: ACTIONS.UPDATE_CELL, payload: { row, col, value } });
        },

        setSelectedCell: (cell) => {
            dispatch({ type: ACTIONS.SET_SELECTED_CELL, payload: cell });
        },

        showHint: () => {
            if (!state.board || state.isComplete) {
                return;
            }
            const hint = findHintCell(state.board, state.size, state.givenCells);
            if (hint) {
                dispatch({ 
                    type: ACTIONS.SHOW_HINT, 
                    payload: [hint.row, hint.col] 
                });
            }
        },

        clearHint: () => {
            dispatch({ type: ACTIONS.CLEAR_HINT });
        },

        loadGameFromAPI: (gameData) => {
            dispatch({ type: ACTIONS.LOAD_GAME_FROM_API, payload: gameData });
        },
    };

    return (
        <SudokuContext.Provider value={{ ...state, ...actions }}>
            {children}
        </SudokuContext.Provider>
    );
}

// Custom hook
export function useSudoku() {
    const context = useContext(SudokuContext);
    if (!context) {
        throw new Error('useSudoku must be used within SudokuProvider');
    }
    return context;
}

