import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSudoku } from "../context/SudokuContext";
import SudokuBoard from "../components/SudokuBoard";
import Timer from "../components/Timer";
import GameControls from "../components/GameControls";
import Congratulations from "../components/Congratulations";
import { getPlayerId } from "../utils/playerUtils";
import "../styles/common.css";
import "../styles/game-easy.css";
import "../styles/game-hard.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function GameById() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gameInfo, setGameInfo] = useState(null);
    const [isPreviouslyCompleted, setIsPreviouslyCompleted] = useState(false);
    const [currentCompletionTime, setCurrentCompletionTime] = useState(null); // Time for current session completion
    const [bestTime, setBestTime] = useState(null); // User's best time for this game
    const [originalBoardInitial, setOriginalBoardInitial] = useState(null); // Store original puzzle to determine given cells
    const hasLoadedRef = useRef(false);
    const currentGameIdRef = useRef(null);

    const {
        board,
        size: gameSize,
        givenCells,
        selectedCell,
        invalidCells,
        hintCell,
        timer,
        isComplete,
        loadGameFromAPI,
        updateCell,
        setSelectedCell,
        showHint,
        clearHint,
        resetGame,
        setGameComplete,
    } = useSudoku();

    // Track if we've already saved the completion to highscore
    const hasSavedCompletionRef = useRef(false);

    // Load game from API
    useEffect(() => {
        // Only fetch if gameId changed or hasn't been loaded yet
        if (!gameId || (hasLoadedRef.current && currentGameIdRef.current === gameId)) {
            return;
        }

        const fetchGame = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get current user ID
                const userId = getPlayerId();
                if (!userId) {
                    // User not initialized yet, wait a bit and retry
                    setTimeout(() => {
                        if (!hasLoadedRef.current) {
                            fetchGame();
                        }
                    }, 100);
                    return;
                }

                // First, check if user has completed this game and get best time
                let completedScore = null;
                let userBestTime = null;
                try {
                    const scoreResponse = await fetch(
                        `${API_BASE_URL}/api/highscore/${gameId}?playerId=${userId}`
                    );
                    if (scoreResponse.ok) {
                        completedScore = await scoreResponse.json();
                        setIsPreviouslyCompleted(true);
                        userBestTime = completedScore.timeSeconds;
                        // Don't set currentCompletionTime here - only set it when user completes in current session
                    } else if (scoreResponse.status === 404) {
                        // User hasn't completed this game yet
                        setIsPreviouslyCompleted(false);
                        userBestTime = null;
                    }
                } catch (scoreErr) {
                    console.error("Error checking completion status:", scoreErr);
                    // Continue to load game even if check fails
                }
                
                // Set best time (even if user hasn't completed, this will be null)
                setBestTime(userBestTime);
                // Clear current completion time when loading a new game
                setCurrentCompletionTime(null);

                // Load game from API
                const response = await fetch(`${API_BASE_URL}/api/sudoku/${gameId}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setError("Game not found");
                    } else {
                        throw new Error("Failed to fetch game");
                    }
                    setLoading(false);
                    return;
                }

                const gameData = await response.json();
                setGameInfo(gameData);

                // Convert 0s to nulls for frontend (0 represents empty cells in DB)
                const boardInitial = gameData.boardInitial.map(row => 
                    row.map(cell => cell === 0 ? null : cell)
                );
                
                // Save original boardInitial to determine given cells later
                setOriginalBoardInitial(boardInitial);

                // If user has completed this game, show the solution
                if (completedScore) {
                    // Load with solution as board, but we'll use originalBoardInitial for givenCells
                    loadGameFromAPI({
                        boardInitial: gameData.boardSolution.map(row => 
                            row.map(cell => cell === 0 ? null : cell)
                        ),
                        boardSolution: gameData.boardSolution,
                        size: gameData.size,
                    });
                    // Mark game as complete and stop timer since it's already completed
                    setGameComplete();
                } else {
                    // Load normal game (initial puzzle)
                    loadGameFromAPI({
                        boardInitial: boardInitial,
                        boardSolution: gameData.boardSolution,
                        size: gameData.size,
                    });
                }

                hasLoadedRef.current = true;
                currentGameIdRef.current = gameId;
            } catch (err) {
                console.error("Error fetching game:", err);
                setError("Failed to load game. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId]); // Only depend on gameId, not loadGameFromAPI

    const handleCellSelect = (row, col) => {
        if (!isComplete) {
            setSelectedCell([row, col]);
        }
    };

    const handleCellChange = (row, col, value) => {
        if (!isComplete) {
            updateCell(row, col, value);
            if (hintCell) {
                clearHint();
            }
        }
    };

    const handleHint = () => {
        if (!isComplete) {
            showHint();
        }
    };

    const handleReset = () => {
        // Clear the previously completed flag so user can play again
        setIsPreviouslyCompleted(false);
        setCurrentCompletionTime(null); // Clear current session completion time
        // Reset the saved completion ref so we can save again if completed
        hasSavedCompletionRef.current = false;
        // Note: bestTime is NOT cleared - it represents the user's historical best time
        
        // Reset game state - reload initial puzzle (not solution)
        if (gameInfo) {
            const boardInitial = gameInfo.boardInitial.map(row => 
                row.map(cell => cell === 0 ? null : cell)
            );
            loadGameFromAPI({
                boardInitial: boardInitial,
                boardSolution: gameInfo.boardSolution,
                size: gameInfo.size,
            });
        } else {
            // Fallback to context reset if gameInfo not available
            resetGame();
        }
    };

    // Save completion to highscore when game is completed
    // This will create a new record if none exists, or update if new time is better
    useEffect(() => {
        if (isComplete && !hasSavedCompletionRef.current && gameId && gameInfo) {
            const userId = getPlayerId();
            if (userId && timer > 0) {
                // Save or update completion in highscore
                // Backend will check if record exists and update if new time is better
                fetch(`${API_BASE_URL}/api/highscore`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gameId: gameId,
                        playerId: userId,
                        timeSeconds: timer,
                    }),
                })
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error("Failed to save completion to highscore");
                        }
                    })
                    .then((scoreData) => {
                        hasSavedCompletionRef.current = true;
                        
                        // Set current completion time (this is the time for current session)
                        setCurrentCompletionTime(timer);
                        
                        // Update the UI state
                        setIsPreviouslyCompleted(true);
                        setBestTime(scoreData.timeSeconds); // Update best time (may be same or better)
                        
                        // Reload game with solution displayed but keep original givenCells
                        if (gameInfo.boardSolution) {
                            loadGameFromAPI({
                                boardInitial: gameInfo.boardSolution.map(row => 
                                    row.map(cell => cell === 0 ? null : cell)
                                ),
                                boardSolution: gameInfo.boardSolution,
                                size: gameInfo.size,
                            });
                        }
                    })
                    .catch((err) => {
                        console.error("Error saving completion to highscore:", err);
                    });
            }
        }
    }, [isComplete, gameId, timer, gameInfo, loadGameFromAPI]);

    // Reset hasSavedCompletionRef when gameId changes
    useEffect(() => {
        hasSavedCompletionRef.current = false;
    }, [gameId]);

    if (loading) {
        return (
            <main className="container">
                <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
                    Loading game...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="container">
                <div style={{ textAlign: "center", padding: "48px" }}>
                    <p style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</p>
                    <button
                        onClick={() => navigate("/games")}
                        style={{
                            padding: "10px 20px",
                            background: "#3b82f6",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Back to Game Selection
                    </button>
                </div>
            </main>
        );
    }

    if (!board || !gameInfo || !gameSize) {
        return (
            <main className="container">
                <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
                    Loading game...
                </div>
            </main>
        );
    }

    const gameTypeClass = gameSize === 6 ? 'game-easy' : 'game-normal';
    const title = `${gameInfo.name} - ${gameInfo.difficulty}`;

    // Calculate givenCells based on original boardInitial when showing completed game
    // This ensures we can distinguish puzzle cells from player-filled cells
    let displayGivenCells = givenCells || [];
    if (originalBoardInitial && isPreviouslyCompleted && Array.isArray(originalBoardInitial) && gameSize) {
        // When showing completed game, use original boardInitial to determine given cells
        // Only cells that were non-zero in the original puzzle are considered "given"
        const originalGivenCells = [];
        for (let r = 0; r < gameSize && r < originalBoardInitial.length; r++) {
            if (Array.isArray(originalBoardInitial[r])) {
                for (let c = 0; c < gameSize && c < originalBoardInitial[r].length; c++) {
                    if (originalBoardInitial[r][c] !== null && originalBoardInitial[r][c] !== 0) {
                        originalGivenCells.push([r, c]);
                    }
                }
            }
        }
        displayGivenCells = originalGivenCells;
    }

    return (
        <>
            <main className={`container ${gameTypeClass}`}>
                <div className="game-content">
                    <section className="page-head">
                        <h1 className="page-title">{title}</h1>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                            {currentCompletionTime !== null ? (
                                // Show "Completed in" only when user completes in current session
                                <div style={{ 
                                    padding: "8px 16px", 
                                    background: "#10b981", 
                                    color: "#ffffff", 
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500"
                                }}>
                                    Completed in {Math.floor(currentCompletionTime / 60)}:{(currentCompletionTime % 60).toString().padStart(2, '0')}
                                </div>
                            ) : (isComplete || isPreviouslyCompleted) ? null : (
                                // Only show Timer when game is not completed (neither in current session nor previously)
                                <Timer seconds={timer} />
                            )}
                            {bestTime !== null && (
                                <div style={{ 
                                    padding: "8px 16px", 
                                    background: "#3b82f6", 
                                    color: "#ffffff", 
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500"
                                }}>
                                    Best Score: {Math.floor(bestTime / 60)}:{(bestTime % 60).toString().padStart(2, '0')}
                                </div>
                            )}
                        </div>
                    </section>

                    {isPreviouslyCompleted && (
                        <div style={{
                            padding: "12px 16px",
                            background: "#d1fae5",
                            color: "#065f46",
                            borderRadius: "6px",
                            marginBottom: "16px",
                            textAlign: "center",
                            fontWeight: "500"
                        }}>
                            ✓ You have already completed this game. Solution is shown below.
                        </div>
                    )}

                    {(isComplete || isPreviouslyCompleted) && !isPreviouslyCompleted && (
                        <Congratulations time={timer} />
                    )}

                    <SudokuBoard
                        board={board}
                        size={gameSize}
                        givenCells={displayGivenCells}
                        selectedCell={selectedCell}
                        invalidCells={invalidCells}
                        hintCell={hintCell}
                        onCellSelect={handleCellSelect}
                        onCellChange={handleCellChange}
                        isCompleted={isComplete || isPreviouslyCompleted}
                    />

                    <GameControls
                        onHint={handleHint}
                        onNewGame={() => navigate("/games")}
                        onReset={handleReset}
                        isComplete={isComplete || isPreviouslyCompleted}
                        showNewGame={false}
                    />
                </div>
            </main>

            <footer className="site-footer">
                <div className="container">
                    <p>© 2025 Sudoku Arcade · CS5610 Web Development · by Xihao Liu</p>
                </div>
            </footer>
        </>
    );
}

