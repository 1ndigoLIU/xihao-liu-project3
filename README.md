# Sudoku Arcade

**Author:** Xihao Liu  
**Course:** CS5610 Web Development  
**Project:** Project 3 - Sudoku  
**Live Site:** https://xihao-liu-project3.onrender.com

---

## Overview

Sudoku Arcade is a full-stack web application that provides an interactive Sudoku gaming experience. Players can browse and play pre-generated Sudoku puzzles, create custom puzzles, track high scores, and compete on leaderboards. The application features a modern React frontend with a Node.js/Express backend, using MongoDB for data persistence.

## Features

- **Game Selection**: Browse and select from a collection of Sudoku puzzles with different difficulty levels
- **Interactive Gameplay**: Play Sudoku puzzles with real-time validation and hints
- **Custom Game Creation**: Create your own Sudoku puzzles with validation to ensure they have exactly one solution
- **High Score Tracking**: Track completion times and view leaderboards for each game
- **Guest User System**: Automatic guest user generation for immediate gameplay
- **Timer**: Real-time timer tracking during gameplay
- **Real-time Validation**: Instant feedback on invalid cell placements

## Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and development server
- **CSS** - Custom styling with responsive design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin resource sharing
- **Cookie Parser** - Cookie handling

## Project Structure

```
xihao-liu-project3/
├── backend/                    # Backend server code
│   ├── apis/                  # API route handlers
│   │   ├── highscore.js       # High score API endpoints
│   │   ├── sudoku.js          # Sudoku game API endpoints
│   │   └── user.js            # User management API endpoints
│   ├── data/                  # Static data files
│   │   └── words.json         # Word list for game name generation
│   ├── db/                    # Database models and schemas
│   │   ├── highscore/         # High score data models
│   │   │   ├── highscore.model.js
│   │   │   └── highscore.schema.js
│   │   ├── sudoku/            # Sudoku game data models
│   │   │   ├── sudoku.model.js
│   │   │   └── sudoku.schema.js
│   │   └── user/              # User data models
│   │       ├── user.model.js
│   │       └── user.schema.js
│   ├── utils/                 # Utility functions
│   │   ├── gameNameGenerator.js    # Generates unique game names
│   │   ├── guestIdGenerator.js     # Generates guest user IDs
│   │   └── sudokuGenerator.js      # Sudoku puzzle generation and validation
│   ├── server.js              # Main server entry point
│   └── package.json           # Backend dependencies
│
├── frontend/                  # Frontend React application
│   ├── dist/                  # Production build output
│   ├── public/                # Static assets
│   │   └── assets/            # Images, fonts, etc.
│   │       ├── fonts/
│   │       └── img/
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── Congratulations.jsx      # Completion message component
│   │   │   ├── GameControls.jsx         # Game control buttons
│   │   │   ├── GuestUserInitializer.jsx # Guest user setup
│   │   │   ├── Navbar.jsx               # Navigation bar
│   │   │   ├── SudokuBoard.jsx          # Main game board component
│   │   │   ├── SudokuCell.jsx           # Individual cell component
│   │   │   └── Timer.jsx                # Game timer component
│   │   ├── context/           # React context providers
│   │   │   └── SudokuContext.jsx        # Global game state management
│   │   ├── pages/             # Page components (routes)
│   │   │   ├── CustomGame.jsx           # Custom puzzle creation page
│   │   │   ├── GameById.jsx             # Individual game play page
│   │   │   ├── GameSelection.jsx        # Game browsing page
│   │   │   ├── GameScores.jsx           # Game-specific scores page
│   │   │   ├── Home.jsx                 # Home page
│   │   │   ├── Login.jsx                # Login page (UI only)
│   │   │   ├── Register.jsx             # Registration page (UI only)
│   │   │   ├── Rules.jsx                # Rules and credits page
│   │   │   └── Scores.jsx                # Global high scores page
│   │   ├── styles/            # CSS stylesheets
│   │   │   ├── common.css               # Shared styles
│   │   │   ├── game-easy.css            # Easy game styling
│   │   │   ├── game-hard.css            # Hard game styling
│   │   │   ├── high-scores.css          # Scores page styling
│   │   │   ├── home.css                 # Home page styling
│   │   │   ├── login.css                # Login page styling
│   │   │   ├── register.css             # Register page styling
│   │   │   ├── rules.css                # Rules page styling
│   │   │   └── selection.css            # Game selection styling
│   │   ├── utils/             # Utility functions
│   │   │   ├── hintUtils.js             # Hint generation logic
│   │   │   ├── playerUtils.js           # Player management utilities
│   │   │   ├── sudokuGenerator.js       # Frontend Sudoku utilities
│   │   │   └── timeFormatter.js         # Time formatting utilities
│   │   ├── App.jsx            # Main app component with routing
│   │   ├── App.css            # App-level styles
│   │   ├── index.css          # Global styles
│   │   └── main.jsx           # Application entry point
│   ├── index.html             # HTML template
│   ├── vite.config.js         # Vite configuration
│   ├── eslint.config.js       # ESLint configuration
│   └── package.json           # Frontend dependencies
│
├── package.json               # Root workspace configuration
├── package-lock.json          # Dependency lock file
├── README.md                  # This file
└── Writeup.md                 # Project writeup and documentation
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas connection string)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/1ndigoLIU/xihao-liu-project3.git
   cd xihao-liu-project3
   ```

2. **Install dependencies**
   ```bash
   # Install root workspace dependencies
   npm install
   
   # Dependencies for backend and frontend will be installed automatically
   # via npm workspaces
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/sudoku
   PORT=8000
   ```
   
   For production (e.g., Render), set these in your hosting platform's environment variables.

4. **Configure frontend API URL** (optional)
   
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
   
   If not set, the frontend defaults to `http://localhost:8000`.

## Running the Application

### Development Mode

1. **Start MongoDB** (if using local instance)
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGODB_URI in backend/.env
   ```

2. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:8000` (or the PORT specified in `.env`).

3. **Start the frontend development server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (Vite default port).

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```
   This creates an optimized production build in `frontend/dist/`.

2. **Start the production server**
   ```bash
   npm run prod
   ```
   This starts the Express server which serves both the API and the static frontend files.

## API Endpoints

### Sudoku Games
- `GET /api/sudoku` - Get all games
- `GET /api/sudoku/:gameId` - Get a specific game by ID
- `POST /api/sudoku/custom` - Create a custom game
- `POST /api/sudoku/generate` - Generate a new random game

### High Scores
- `GET /api/highscore` - Get all high scores
- `GET /api/highscore/game/:gameId` - Get scores for a specific game
- `POST /api/highscore` - Submit a new high score

### Users
- `GET /api/user` - Get all users
- `GET /api/user/:userId` - Get a specific user
- `POST /api/user/guest` - Create a guest user

### Health Check
- `GET /api/health` - Check server and database status (for debugging)

## Key Features Implementation

### Custom Game Creation (Bonus Feature)
Users can create custom Sudoku puzzles through an interactive 9x9 board interface. The system validates that:
- The puzzle has no immediate conflicts (duplicate numbers in rows, columns, or 3x3 subgrids)
- The puzzle has exactly one valid solution
- The puzzle is solvable

### Guest User System
The application automatically creates guest users with unique auto-generated names, allowing immediate gameplay without registration.

### Real-time Validation
Invalid cell placements are highlighted in real-time as users type, checking rows, columns, and 3x3 subgrids for conflicts.

## Development Notes

- The project uses npm workspaces to manage both frontend and backend dependencies
- Frontend and backend can run independently during development
- In production, the Express server serves the built frontend static files
- MongoDB connection is configured via environment variables for flexibility

## License

This project is part of CS5610 Web Development coursework at Northeastern University.