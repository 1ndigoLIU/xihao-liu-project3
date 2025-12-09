import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getGuestUser } from "../utils/playerUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function Navbar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const userMenuRef = useRef(null);

    const active = (path) => {
        if (path === "/") {
            return pathname === "/" ? "active" : "";
        }
        // For /games, only match exactly /games
        if (path === "/games") {
            return pathname === "/games" ? "active" : "";
        }
        return pathname === path || pathname.startsWith(path + "/") ? "active" : "";
    };

    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [pathname]);

    // Fetch user information
    useEffect(() => {
        const fetchUserInfo = async () => {
            const storedUser = getGuestUser();
            if (!storedUser || !storedUser.id) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/user/id/${storedUser.id}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUserInfo(userData);
                } else {
                    // If user not found, clear stored user
                    setUserInfo(null);
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
                // Fallback to stored user info
                setUserInfo({
                    id: storedUser.id,
                    nickname: storedUser.nickname,
                    isGuest: storedUser.isGuest !== undefined ? storedUser.isGuest : true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMenu = () => setIsMenuOpen(false);
    const toggleUserMenu = () => setIsUserMenuOpen((prev) => !prev);

    const handleMenuClick = (path) => {
        navigate(path);
        setIsUserMenuOpen(false);
    };

    const isGuest = userInfo?.isGuest !== false; // Default to guest if undefined

    return (
        <header className="site-header">
            <div className="container header-inner">
                <Link to="/" className="brand">Sudoku Arcade</Link>

                <nav className={`site-nav ${isMenuOpen ? "is-open" : ""}`} aria-label="Primary">
                    <button
                        type="button"
                        className="nav-close"
                        aria-label="Close navigation"
                        onClick={closeMenu}
                    >
                        ×
                    </button>

                    {/* User Info - Mobile (at top) */}
                    {!loading && userInfo && (
                        <div className="user-info-mobile" ref={userMenuRef}>
                            <div className="user-profile" onClick={toggleUserMenu}>
                                <img
                                    src="/assets/img/default avatar.png"
                                    alt="Avatar"
                                    className="user-avatar"
                                />
                                <span className="user-nickname">{userInfo.nickname || "Guest"}</span>
                                <svg
                                    className="dropdown-arrow"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M2 4L6 8L10 4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            {isUserMenuOpen && (
                                <div className="user-dropdown">
                                    {isGuest ? (
                                        <>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/login")}
                                            >
                                                Log In
                                            </button>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/register")}
                                            >
                                                Sign Up
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/settings")}
                                            >
                                                Setting
                                            </button>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/logout")}
                                            >
                                                Log Out
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <ul className="nav-list">
                        <li><Link to="/" className={active("/")}>Home</Link></li>
                        <li><Link to="/games" className={active("/games")}>Game Selection</Link></li>
                        <li><Link to="/rules" className={active("/rules")}>Rules</Link></li>
                        <li><Link to="/scores" className={active("/scores")}>High Scores</Link></li>
                        {!userInfo && (
                            <>
                                <li><Link to="/login" className={active("/login")}>Login</Link></li>
                                <li><Link to="/register" className={active("/register")}>Register</Link></li>
                            </>
                        )}
                    </ul>
                </nav>

                <div className="header-right">
                    {/* User Info - Desktop */}
                    {!loading && userInfo && (
                        <div className="user-info-desktop" ref={userMenuRef}>
                            <div className="user-profile" onClick={toggleUserMenu}>
                                <img
                                    src="/assets/img/default avatar.png"
                                    alt="Avatar"
                                    className="user-avatar"
                                />
                                <span className="user-nickname">{userInfo.nickname || "Guest"}</span>
                                <svg
                                    className="dropdown-arrow"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M2 4L6 8L10 4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            {isUserMenuOpen && (
                                <div className="user-dropdown">
                                    {isGuest ? (
                                        <>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/login")}
                                            >
                                                Log In
                                            </button>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/register")}
                                            >
                                                Sign Up
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/settings")}
                                            >
                                                Setting
                                            </button>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => handleMenuClick("/logout")}
                                            >
                                                Log Out
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        className="nav-toggle"
                        aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
                        aria-expanded={isMenuOpen}
                        onClick={toggleMenu}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </div>
            <div
                className={`nav-overlay ${isMenuOpen ? "visible" : ""}`}
                role="presentation"
                onClick={closeMenu}
            />
        </header>
    );
}
