import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {getPlayerId} from "../utils/playerUtils";
import "../styles/common.css";
import "../styles/selection.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function GameSelection() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    // Fetch games from API
    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/sudoku`);
            if (!response.ok) {
                throw new Error("Failed to fetch games");
            }
            const data = await response.json();
            setGames(data);
        } catch (error) {
            console.error("Error fetching games:", error);
        } finally {
            setLoading(false);
        }
    };

    const createGame = async (difficulty) => {
        try {
            setCreating(true);
            let userId = getPlayerId(); // Get current user ID (ObjectId)

            // If user is not initialized, wait a bit for GuestUserInitializer to complete
            if (!userId) {
                // Wait up to 2 seconds for initialization
                for (let i = 0; i < 4; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    userId = getPlayerId();
                    if (userId) break;
                }

                if (!userId) {
                    alert("Please wait for user initialization to complete, then try again.");
                    setCreating(false);
                    return;
                }
            }

            const response = await fetch(`${API_BASE_URL}/api/sudoku`, {
                method: "POST", headers: {
                    "Content-Type": "application/json",
                }, body: JSON.stringify({
                    difficulty, createdByUserId: userId, // Use user ID (ObjectId)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Server error: ${response.status}`;
                console.error("Error creating game:", errorMessage);
                alert(`Failed to create game: ${errorMessage}`);
                return;
            }

            const data = await response.json();
            // Redirect to game page
            navigate(`/game/${data.id}`);
        } catch (error) {
            console.error("Error creating game:", error);
            const errorMessage = error.message || "Network error. Please check if the backend server is running.";
            alert(`Failed to create game: ${errorMessage}`);
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    return (<>
        <main className="container">
            <section className="page-head">
                <h1 className="page-title">Game Selection</h1>
                <p className="lead">Create a new game or select an existing one to play.</p>
            </section>

            <section className="game-actions">
                <button
                    className="btn-create btn-create-normal"
                    onClick={() => createGame("NORMAL")}
                    disabled={creating}
                >
                    {creating ? "Creating..." : "Create Normal Game"}
                </button>
                <button
                    className="btn-create btn-create-easy"
                    onClick={() => createGame("EASY")}
                    disabled={creating}
                >
                    {creating ? "Creating..." : "Create Easy Game"}
                </button>
                <button
                    className="btn-create btn-create-custom"
                    onClick={() => navigate("/custom")}
                    disabled={creating}
                >
                    Create Custom Game
                </button>
            </section>

            {loading ? (<div className="loading">Loading games...</div>) : (<div className="table-wrap">
                <table className="game-table">
                    <thead>
                    <tr>
                        <th scope="col">Game Name</th>
                        <th scope="col">Difficulty</th>
                        <th scope="col">Created By</th>
                        <th scope="col">Date Created</th>
                    </tr>
                    </thead>
                    <tbody>
                    {games.length === 0 ? (<tr>
                        <td colSpan="4" style={{textAlign: "center", color: "#9ca3af"}}>
                            No games available. Create a new game to get started!
                        </td>
                    </tr>) : (games.map((game) => (<tr key={game._id}>
                        <td>
                            <a
                                href={`/game/${game._id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/game/${game._id}`);
                                }}
                            >
                                {game.name}
                            </a>
                        </td>
                        <td>{game.difficulty}</td>
                        <td>{game.createdBy?.nickname || game.createdBy?.username || "Guest"}</td>
                        <td>{formatDate(game.createdAt)}</td>
                    </tr>)))}
                    </tbody>
                </table>
            </div>)}
        </main>

        <footer className="site-footer">
            <div className="container">
                <p>© 2025 Sudoku Arcade · CS5610 Web Development · by Xihao (Indigo) Liu</p>
            </div>
        </footer>
    </>);
}
