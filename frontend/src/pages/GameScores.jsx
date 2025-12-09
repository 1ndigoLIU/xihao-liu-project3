import {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {formatTime} from "../utils/timeFormatter";
import "../styles/common.css";
import "../styles/high-scores.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function GameScores() {
    const {gameId} = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gameInfo, setGameInfo] = useState(null);
    const [scores, setScores] = useState([]);
    const [bestRecord, setBestRecord] = useState(null);

    useEffect(() => {
        if (gameId) {
            fetchGameData();
        }
    }, [gameId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const fetchGameData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch game information and scores in parallel
            const [gameResponse, scoresResponse] = await Promise.all([fetch(`${API_BASE_URL}/api/sudoku/${gameId}`), fetch(`${API_BASE_URL}/api/highscore/${gameId}`),]);

            if (!gameResponse.ok) {
                if (gameResponse.status === 404) {
                    setError("Game not found");
                } else {
                    throw new Error("Failed to fetch game information");
                }
                setLoading(false);
                return;
            }

            if (!scoresResponse.ok) {
                throw new Error("Failed to fetch scores");
            }

            const gameData = await gameResponse.json();
            const scoresData = await scoresResponse.json();

            setGameInfo(gameData);

            // Scores are already sorted by timeSeconds (ascending) from backend
            // Find the best record (first one, since it's sorted by time)
            if (scoresData.length > 0) {
                setBestRecord(scoresData[0]);
            }

            // Map scores and ensure each player only appears once with their best time
            // Group by playerId and keep only the best (first) record for each player
            const playerRecordsMap = new Map();
            scoresData.forEach((score) => {
                const playerId = score.playerId?._id || score.playerId?.id || score.playerId;
                if (playerId) {
                    const playerIdStr = typeof playerId === 'object' ? playerId.toString() : playerId;
                    // Only keep the first record for each player (which is already the best due to sorting)
                    if (!playerRecordsMap.has(playerIdStr)) {
                        playerRecordsMap.set(playerIdStr, {
                            playerId: playerIdStr,
                            playerNickname: score.playerId?.nickname || score.playerId?.username || "Unknown Player",
                            timeSeconds: score.timeSeconds,
                            completedDate: score.createdAt,
                        });
                    }
                }
            });

            // Convert map to array (already sorted by time since we process in order)
            const formattedScores = Array.from(playerRecordsMap.values());

            setScores(formattedScores);
        } catch (error) {
            console.error("Error fetching game scores:", error);
            setError("Failed to load game scores. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (<>
            <main className="container">
                <div className="loading">Loading game scores...</div>
            </main>
        </>);
    }

    if (error) {
        return (<>
            <main className="container">
                <div className="error" style={{color: "#ef4444", padding: "20px", textAlign: "center"}}>
                    {error}
                </div>
            </main>
        </>);
    }

    if (!gameInfo) {
        return (<>
            <main className="container">
                <div className="error" style={{color: "#ef4444", padding: "20px", textAlign: "center"}}>
                    Game not found
                </div>
            </main>
        </>);
    }

    return (<>
        <main className="container">
            <section className="page-head">
                <h1 className="page-title">Game Scores: {gameInfo.name}</h1>
                <p className="lead">View leaderboard and completion records for this game.</p>
            </section>

            {/* Game Information Section */}
            <section style={{
                background: "#111827",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "24px",
            }}>
                <h2 style={{
                    marginTop: "0", marginBottom: "16px", fontSize: "20px", color: "#e5e7eb",
                }}>
                    Game Information
                </h2>
                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px",
                }}>
                    <div>
                        <div style={{color: "#9ca3af", fontSize: "14px", marginBottom: "4px"}}>Game Name</div>
                        <div style={{color: "#e5e7eb", fontSize: "16px", fontWeight: "500"}}>
                            {gameInfo.name}
                        </div>
                    </div>
                    <div>
                        <div style={{color: "#9ca3af", fontSize: "14px", marginBottom: "4px"}}>Difficulty</div>
                        <div style={{color: "#e5e7eb", fontSize: "16px", fontWeight: "500"}}>
                            {gameInfo.difficulty}
                        </div>
                    </div>
                    <div>
                        <div style={{color: "#9ca3af", fontSize: "14px", marginBottom: "4px"}}>Created By</div>
                        <div style={{color: "#e5e7eb", fontSize: "16px", fontWeight: "500"}}>
                            {gameInfo.createdBy?.nickname || gameInfo.createdBy?.username || "Guest"}
                        </div>
                    </div>
                    <div>
                        <div style={{color: "#9ca3af", fontSize: "14px", marginBottom: "4px"}}>Created Date</div>
                        <div style={{color: "#e5e7eb", fontSize: "16px", fontWeight: "500"}}>
                            {formatDate(gameInfo.createdAt)}
                        </div>
                    </div>
                    <div>
                        <div style={{color: "#9ca3af", fontSize: "14px", marginBottom: "4px"}}>Best Record</div>
                        <div style={{color: "#10b981", fontSize: "16px", fontWeight: "500"}}>
                            {bestRecord ? formatTime(bestRecord.timeSeconds) : "N/A"}
                        </div>
                    </div>
                    <div>
                        <div style={{color: "#9ca3af", fontSize: "14px", marginBottom: "4px"}}>Record Date</div>
                        <div style={{color: "#e5e7eb", fontSize: "16px", fontWeight: "500"}}>
                            {bestRecord ? formatDate(bestRecord.createdAt) : "N/A"}
                        </div>
                    </div>
                </div>
            </section>

            {/* Leaderboard Section */}
            <section>
                <h2 style={{
                    marginTop: "0", marginBottom: "16px", fontSize: "20px", color: "#e5e7eb",
                }}>
                    Leaderboard
                </h2>
                <p style={{
                    color: "#9ca3af", marginBottom: "16px",
                }}>
                    All players who completed this game, ranked by completion time (fastest first).
                </p>
                <div className="table-wrap">
                    <table className="score-table" aria-label="Game leaderboard">
                        <thead>
                        <tr>
                            <th scope="col">Player</th>
                            <th scope="col">Time</th>
                            <th scope="col">Completed Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {scores.length === 0 ? (<tr>
                            <td colSpan="3" style={{textAlign: "center", color: "#9ca3af"}}>
                                No players have completed this game yet. Be the first!
                            </td>
                        </tr>) : (scores.map((score) => (<tr key={score.playerId}>
                            <td>{score.playerNickname}</td>
                            <td>{formatTime(score.timeSeconds)}</td>
                            <td>{formatDate(score.completedDate)}</td>
                        </tr>)))}
                        </tbody>
                    </table>
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

