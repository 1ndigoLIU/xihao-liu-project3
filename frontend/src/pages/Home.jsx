import { Link } from "react-router-dom";
import "../styles/common.css";
import "../styles/home.css";

export default function Home() {
    return (
        <>
            <main className="container">
                <section className="hero">
                    <div className="hero-text">
                        <h1 className="page-title">Welcome to <span className="brand-mark">Sudoku Arcade</span></h1>
                        <p className="lead">A simple puzzle hub — pick a mode and start exploring.</p>
                    </div>
                    <div className="hero-media">
                        <img src="/assets/img/Sudoku.svg" alt="A simple Sudoku Arcade illustration" />
                    </div>
                </section>

                <section className="links">
                    <h2 className="section-title">Explore</h2>
                    <ul className="link-grid">
                        <li>
                            <h3>Game Selection</h3>
                            <p>Browse game titles and authors.</p>
                            <Link to="/games">Go to Games</Link>
                        </li>

                        <li>
                            <h3>Rules &amp; Credits</h3>
                            <p>How it works and who made it.</p>
                            <Link to="/rules">See Rules</Link>
                        </li>

                        <li>
                            <h3>High Scores</h3>
                            <p>Check the high score board.</p>
                            <Link to="/scores">View Scores</Link>
                        </li>
                    </ul>
                </section>
            </main>

            <footer className="site-footer">
                <div className="container">
                    <p>© 2025 Sudoku Arcade · CS5610 Web Development · by Xihao (Indigo) Liu</p>
                </div>
            </footer>
        </>
    );
}