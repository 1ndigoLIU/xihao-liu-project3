import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSudoku } from "../context/SudokuContext";
import SudokuBoard from "../components/SudokuBoard";
import Timer from "../components/Timer";
import GameControls from "../components/GameControls";
import Congratulations from "../components/Congratulations";
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

                // Load game into context
                // Convert 0s to nulls for frontend (0 represents empty cells in DB)
                const boardInitial = gameData.boardInitial.map(row => 
                    row.map(cell => cell === 0 ? null : cell)
                );
                
                loadGameFromAPI({
                    boardInitial: boardInitial,
                    boardSolution: gameData.boardSolution,
                    size: gameData.size,
                });

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
                        <Timer seconds={timer} />
                    </section>

                    {isComplete && <Congratulations time={timer} />}

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
                        isComplete={isComplete}
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

