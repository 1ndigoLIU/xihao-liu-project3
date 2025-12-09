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
    const [completedTime, setCompletedTime] = useState(null);
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

                // First, check if user has completed this game
                let completedScore = null;
                try {
                    const scoreResponse = await fetch(
                        `${API_BASE_URL}/api/highscore/${gameId}?playerId=${userId}`
                    );
                    if (scoreResponse.ok) {
                        completedScore = await scoreResponse.json();
                        setIsPreviouslyCompleted(true);
                        setCompletedTime(completedScore.timeSeconds);
                    } else if (scoreResponse.status === 404) {
                        // User hasn't completed this game yet
                        setIsPreviouslyCompleted(false);
                        setCompletedTime(null);
                    }
                } catch (scoreErr) {
                    console.error("Error checking completion status:", scoreErr);
                    // Continue to load game even if check fails
                }

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

                // If user has completed this game, show the solution
                if (completedScore) {
                    // Load solution board instead of initial board
                    loadGameFromAPI({
                        boardInitial: gameData.boardSolution.map(row => 
                            row.map(cell => cell === 0 ? null : cell)
                        ),
                        boardSolution: gameData.boardSolution,
                        size: gameData.size,
                    });
                } else {
                    // Load normal game (initial puzzle)
                    // Convert 0s to nulls for frontend (0 represents empty cells in DB)
                    const boardInitial = gameData.boardInitial.map(row => 
                        row.map(cell => cell === 0 ? null : cell)
                    );
                    
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
        if (!isComplete && !isPreviouslyCompleted) {
            setSelectedCell([row, col]);
        }
    };

    const handleCellChange = (row, col, value) => {
        if (!isComplete && !isPreviouslyCompleted) {
            updateCell(row, col, value);
            if (hintCell) {
                clearHint();
            }
        }
    };

    const handleHint = () => {
        if (!isComplete && !isPreviouslyCompleted) {
            showHint();
        }
    };

    // Save completion to highscore when game is completed
    useEffect(() => {
        if (isComplete && !isPreviouslyCompleted && !hasSavedCompletionRef.current && gameId && gameInfo) {
            const userId = getPlayerId();
            if (userId && timer > 0) {
                // Save completion to highscore
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
                            console.log("Game completion saved to highscore");
                            hasSavedCompletionRef.current = true;
                            setIsPreviouslyCompleted(true);
                            setCompletedTime(timer);
                            
                            // Reload game with solution displayed
                            if (gameInfo.boardSolution) {
                                loadGameFromAPI({
                                    boardInitial: gameInfo.boardSolution.map(row => 
                                        row.map(cell => cell === 0 ? null : cell)
                                    ),
                                    boardSolution: gameInfo.boardSolution,
                                    size: gameInfo.size,
                                });
                            }
                        } else {
                            console.error("Failed to save completion to highscore");
                        }
                    })
                    .catch((err) => {
                        console.error("Error saving completion to highscore:", err);
                    });
            }
        }
    }, [isComplete, isPreviouslyCompleted, gameId, timer, gameInfo, loadGameFromAPI]);

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

    if (!board || !gameInfo) {
        return null;
    }

    const gameTypeClass = gameSize === 6 ? 'game-easy' : 'game-normal';
    const title = `${gameInfo.name} - ${gameInfo.difficulty}`;

    return (
        <>
            <main className={`container ${gameTypeClass}`}>
                <div className="game-content">
                    <section className="page-head">
                        <h1 className="page-title">{title}</h1>
                        {isPreviouslyCompleted && completedTime !== null ? (
                            <div style={{ 
                                padding: "8px 16px", 
                                background: "#10b981", 
                                color: "#ffffff", 
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "500"
                            }}>
                                Completed in {Math.floor(completedTime / 60)}:{(completedTime % 60).toString().padStart(2, '0')}
                            </div>
                        ) : (
                            <Timer seconds={timer} />
                        )}
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
                        givenCells={givenCells}
                        selectedCell={selectedCell}
                        invalidCells={invalidCells}
                        hintCell={hintCell}
                        onCellSelect={handleCellSelect}
                        onCellChange={handleCellChange}
                    />

                    <GameControls
                        onHint={handleHint}
                        onNewGame={() => navigate("/games")}
                        onReset={resetGame}
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

