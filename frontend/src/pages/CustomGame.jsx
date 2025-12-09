import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import SudokuBoard from "../components/SudokuBoard";
import {getPlayerId} from "../utils/playerUtils";
import "../styles/common.css";
import "../styles/game-hard.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const SIZE = 9;

export default function CustomGame() {
    const navigate = useNavigate();
    const [board, setBoard] = useState(() => {
        // Initialize empty 9x9 board
        return Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
    });
    const [selectedCell, setSelectedCell] = useState(null);
    const [invalidCells, setInvalidCells] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Check for invalid cells whenever board changes
    useEffect(() => {
        const invalid = [];
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const value = board[row][col];
                if (value !== null && value !== 0) {
                    // Check row
                    for (let c = 0; c < SIZE; c++) {
                        if (c !== col && board[row][c] === value) {
                            invalid.push([row, col]);
                            break;
                        }
                    }
                    // Check column
                    if (!invalid.some(([r, c]) => r === row && c === col)) {
                        for (let r = 0; r < SIZE; r++) {
                            if (r !== row && board[r][col] === value) {
                                invalid.push([row, col]);
                                break;
                            }
                        }
                    }
                    // Check subgrid (3x3)
                    if (!invalid.some(([r, c]) => r === row && c === col)) {
                        const subgridRow = Math.floor(row / 3) * 3;
                        const subgridCol = Math.floor(col / 3) * 3;
                        for (let r = subgridRow; r < subgridRow + 3; r++) {
                            for (let c = subgridCol; c < subgridCol + 3; c++) {
                                if ((r !== row || c !== col) && board[r][c] === value) {
                                    invalid.push([row, col]);
                                    break;
                                }
                            }
                            if (invalid.some(([r, c]) => r === row && c === col)) break;
                        }
                    }
                }
            }
        }
        setInvalidCells(invalid);
    }, [board]);

    const handleCellSelect = (row, col) => {
        setSelectedCell([row, col]);
    };

    const handleCellChange = (row, col, value) => {
        const newBoard = board.map(r => [...r]);

        if (value === '' || value === null) {
            newBoard[row][col] = null;
        } else {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 1 && num <= SIZE) {
                newBoard[row][col] = num;
            } else {
                return; // Invalid number, don't update
            }
        }

        setBoard(newBoard);
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setError(null);

            // Get current user ID
            let userId = getPlayerId();
            if (!userId) {
                // Wait a bit for GuestUserInitializer to complete
                for (let i = 0; i < 4; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    userId = getPlayerId();
                    if (userId) break;
                }

                if (!userId) {
                    setError("Please wait for user initialization to complete, then try again.");
                    setSubmitting(false);
                    return;
                }
            }

            // Convert board to format expected by backend (null -> 0)
            const boardForAPI = board.map(row => row.map(cell => cell === null ? 0 : cell));

            // Submit to backend for validation and creation
            const response = await fetch(`${API_BASE_URL}/api/sudoku/custom`, {
                method: "POST", headers: {
                    "Content-Type": "application/json",
                }, body: JSON.stringify({
                    board: boardForAPI, createdByUserId: userId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Server error: ${response.status}`;
                setError(errorMessage);
                setSubmitting(false);
                return;
            }

            const data = await response.json();
            // Redirect to game page
            navigate(`/game/${data.id}`);
        } catch (err) {
            console.error("Error submitting custom game:", err);
            setError(err.message || "Network error. Please check if the backend server is running.");
            setSubmitting(false);
        }
    };

    return (<>
        <main className="container game-normal">
            <section className="page-head">
                <h1 className="page-title">Create Custom Game</h1>
                <p className="lead">Fill in the Sudoku board to create your own challenge. The puzzle must have
                    exactly one valid solution.</p>
            </section>

            {error && (<div style={{
                padding: "12px 16px",
                margin: "16px 0",
                backgroundColor: "#7f1d1d",
                border: "1px solid #991b1b",
                borderRadius: "8px",
                color: "#fca5a5",
                textAlign: "center"
            }}>
                {error}
            </div>)}

            <section className="game-content">
                <div className="board-wrap">
                    <SudokuBoard
                        board={board}
                        size={SIZE}
                        givenCells={[]} // No given cells in custom game creation
                        selectedCell={selectedCell}
                        invalidCells={invalidCells}
                        hintCell={null}
                        onCellSelect={handleCellSelect}
                        onCellChange={handleCellChange}
                        isCompleted={false}
                    />
                </div>

                <div style={{
                    marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center"
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            padding: "12px 32px",
                            fontSize: "16px",
                            fontWeight: "600",
                            backgroundColor: "#8b5cf6",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.6 : 1,
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            if (!submitting) {
                                e.target.style.backgroundColor = "#7c3aed";
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 4px 8px rgba(139, 92, 246, 0.3)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!submitting) {
                                e.target.style.backgroundColor = "#8b5cf6";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "none";
                            }
                        }}
                    >
                        {submitting ? "Validating..." : "Submit"}
                    </button>
                </div>
            </section>
        </main>

        <footer className="site-footer">
            <div className="container">
                <p>© 2025 Sudoku Arcade · CS5610 Web Development · by Xihao (Indigo) Liu</p>
            </div>
        </footer>
    </>);
}

