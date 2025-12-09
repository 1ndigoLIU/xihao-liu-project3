import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatTime } from "../utils/timeFormatter";
import "../styles/common.css";
import "../styles/high-scores.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function Scores() {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHighScores();
    }, []);

    const fetchHighScores = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/highscore`);
            if (!response.ok) {
                throw new Error("Failed to fetch high scores");
            }
            const data = await response.json();
            // Filter out games with 0 completions and map to include game name, difficulty, and best time
            // After populate, _id is a SudokuGame document object
            // Backend already sorts: completionCount desc, difficulty (EASY before NORMAL), bestTime asc
            const filteredScores = data
                .filter(item => item.completionCount > 0 && item._id)
                .map(item => {
                    // item._id is the populated SudokuGame document
                    const gameDoc = item._id;
                    const gameId = gameDoc._id || gameDoc.id || item._id;
                    const gameName = gameDoc.name || "Unknown Game";
                    const difficulty = gameDoc.difficulty || "NORMAL";
                    const bestTime = item.bestTime ?? null;
                    return {
                        gameId: typeof gameId === 'object' ? gameId.toString() : gameId,
                        gameName: gameName,
                        difficulty: difficulty,
                        playerCount: item.completionCount,
                        bestTime: bestTime,
                    };
                });
            setScores(filteredScores);
        } catch (error) {
            console.error("Error fetching high scores:", error);
            setError("Failed to load high scores. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="container">
                <section className="page-head">
                    <h1 className="page-title">High Scores</h1>
                    <p className="lead">Games ranked by number of players who completed them.</p>
                </section>

                {loading ? (
                    <div className="loading">Loading high scores...</div>
                ) : error ? (
                    <div className="error" style={{ color: "#ef4444", padding: "20px", textAlign: "center" }}>
                        {error}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table className="score-table" aria-label="High score leaderboard">
                            <thead>
                                <tr>
                                    <th scope="col">Game Name</th>
                                    <th scope="col">Difficulty</th>
                                    <th scope="col">Players Completed</th>
                                    <th scope="col">Best Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center", color: "#9ca3af" }}>
                                            No games have been completed yet. Be the first to complete a game!
                                        </td>
                                    </tr>
                                ) : (
                                    scores.map((score) => (
                                        <tr key={score.gameId}>
                                            <td>
                                                <a
                                                    href={`/scores/${score.gameId}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate(`/scores/${score.gameId}`);
                                                    }}
                                                    style={{
                                                        color: "#60a5fa",
                                                        textDecoration: "none",
                                                        cursor: "pointer",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.textDecoration = "underline";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.textDecoration = "none";
                                                    }}
                                                >
                                                    {score.gameName}
                                                </a>
                                            </td>
                                            <td>{score.difficulty}</td>
                                            <td>{score.playerCount}</td>
                                            <td>{score.bestTime !== null ? formatTime(score.bestTime) : "N/A"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <footer className="site-footer">
                <div className="container">
                    <p>© 2025 Sudoku Arcade · CS5610 Web Development · by Xihao Liu</p>
                </div>
            </footer>
        </>
    );
}
