import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SudokuProvider } from "./context/SudokuContext";
import Navbar from "./components/Navbar";
import GuestUserInitializer from "./components/GuestUserInitializer";

import Home from "./pages/Home";
import GameSelection from "./pages/GameSelection";
import GameById from "./pages/GameById";
import CustomGame from "./pages/CustomGame";
import Rules from "./pages/Rules";
import Scores from "./pages/Scores";
import GameScores from "./pages/GameScores";
import Login from "./pages/Login";
import Register from "./pages/Register";

function AppContent() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/games" element={<GameSelection />} />
                <Route path="/game/:gameId" element={<GameById />} />
                <Route path="/custom" element={<CustomGame />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/scores" element={<Scores />} />
                <Route path="/scores/:gameId" element={<GameScores />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <SudokuProvider>
                <GuestUserInitializer />
                <AppContent />
            </SudokuProvider>
        </Router>
    );
}

export default App;
