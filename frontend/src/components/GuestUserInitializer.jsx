import {useEffect, useRef} from "react";
import {getGuestUser, saveGuestUser} from "../utils/playerUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Component to initialize guest user on app startup
 * Creates guest user in database if not already exists
 */
export default function GuestUserInitializer() {
    const hasInitialized = useRef(false);

    useEffect(() => {
        const initializeGuestUser = async () => {
            // Only initialize once
            if (hasInitialized.current) {
                return;
            }

            try {
                // Get guest user from localStorage
                const guestUser = getGuestUser();

                // If user already exists in localStorage, verify it exists in database by ID
                if (guestUser && guestUser.id) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/user/id/${guestUser.id}`);
                        if (response.ok) {
                            // User exists in database, update local storage with latest info
                            const userData = await response.json();
                            saveGuestUser(userData);
                            hasInitialized.current = true;
                            // Dispatch custom event to notify Navbar that user is initialized
                            window.dispatchEvent(new Event('guestUserInitialized'));
                            return;
                        }
                    } catch (error) {
                        console.error("Error verifying guest user:", error);
                        // Continue to create new user if verification fails
                    }
                }

                // Create new guest user in database (backend will generate username and nickname)
                const response = await fetch(`${API_BASE_URL}/api/user/guest`, {
                    method: "POST", headers: {
                        "Content-Type": "application/json",
                    }, // No body needed - backend generates username and nickname
                });

                if (!response.ok) {
                    throw new Error("Failed to create guest user");
                }

                const userData = await response.json();
                saveGuestUser(userData);
                hasInitialized.current = true;
                
                // Dispatch custom event to notify Navbar that user is initialized
                window.dispatchEvent(new Event('guestUserInitialized'));
            } catch (error) {
                console.error("Error initializing guest user:", error);
                // Continue even if initialization fails - user can still play as guest
            }
        };

        initializeGuestUser();
    }, []);

    // This component doesn't render anything
    return null;
}

