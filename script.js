document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const highscoreEl = document.getElementById('highscore');
    const livesEl = document.getElementById('lives');
    const startMenu = document.getElementById('start-menu');
    const gameOverMenu = document.getElementById('game-over-menu');
    const startEasyBtn = document.getElementById('start-easy');
    const startHardBtn = document.getElementById('start-hard');
    const playAgainBtn = document.getElementById('play-again');
    const gameOverTitle = document.getElementById('game-over-title');
    const finalScoreText = document.getElementById('final-score-text');
    const finalHighscoreText = document.getElementById('final-highscore-text');

    // --- Game Constants & Variables ---
    const GRID_SIZE = 20;
    let TILE_SIZE; // Will be calculated based on canvas size
    const V = 4; // Base speed unit

    // Player & Ghost speeds based on spec
    const PLAYER_SPEED = 0.8 * V;
    const GHOST_SPEED_EASY = 0.75 * V * 0.75;
    const GHOST_SPEED_HARD = 0.75 * V * 1.25;

    // Maze Layout: 1=Wall, 0=Dot, 2=Empty, 3=Power Pellet, 9=Ghost House
    const initialMap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 3, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 3, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 2, 9, 9, 9, 9, 9, 9, 2, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 2, 9, 1, 1, 1, 1, 9, 2, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 2, 2, 9, 1, 2, 2, 1, 9, 2, 2, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 2, 9, 1, 1, 1, 1, 9, 2, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 2, 9, 9, 9, 9, 9, 9, 2, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 3, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 3, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    let map;

    // Game State
    let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
    let score = 0;
    let lives = 3;
    let highScore = localStorage.getItem('pixelMuncherHighScore') || 0;
    let totalDots = 0;
    let dotsEaten = 0;
    let lastTime = 0;
    let animationFrameId;

    let player;
    let ghost;
    
    // --- 3. Controls & Input ---
    let touchStartX = 0;
    let touchStartY = 0;

    // --- Classes ---
    class Character {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.radius = TILE_SIZE / 2.5;
            this.dir = { x: 0, y: 0 };
        }

        // A helper to get the grid coordinates of the character
        getGridPos() {
            return {
                row: Math.floor(this.y / TILE_SIZE),
                col: Math.floor(this.x / TILE_SIZE)
            };
        }
    }
    
    class Player extends Character {
        constructor(x, y, speed) {
            super(x, y, speed);
            this.nextDir = { x: 0, y: 0 }; // Input buffer
        }

        draw() {
            ctx.fillStyle = 'var(--player)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.lineTo(this.x, this.y);
            ctx.fill();
        }

        update() {
            this.handleMovement();
            this.eat();
        }

        isAtIntersection() {
            const centerOffset = 0.05; // a small tolerance
            const xInTile = (this.x / TILE_SIZE) % 1;
            const yInTile = (this.y / TILE_SIZE) % 1;
            return Math.abs(xInTile - 0.5) < centerOffset && Math.abs(yInTile - 0.5) < centerOffset;
        }

        handleMovement() {
            // --- Input Buffering Logic ---
            if (this.isAtIntersection()) {
                const { row, col } = this.getGridPos();
                // Check if the buffered direction is valid
                if (this.nextDir.x !== 0 || this.nextDir.y !== 0) {
                    const nextCol = col + this.nextDir.x;
                    const nextRow = row + this.nextDir.y;
                    if (map[nextRow][nextCol] !== 1 && map[nextRow][nextCol] !== 9) {
                        this.dir = { ...this.nextDir };
                        this.nextDir = { x: 0, y: 0 };
                    }
                }
            }

            // Check for wall collision in the current direction
            const nextX = this.x + this.dir.x * this.speed;
            const nextY = this.y + this.dir.y * this.speed;
            
            if (!this.checkWallCollision(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            } else {
                // Snap to grid if colliding
                const { row, col } = this.getGridPos();
                this.x = col * TILE_SIZE + TILE_SIZE / 2;
                this.y = row * TILE_SIZE + TILE_SIZE / 2;
            }

            // Handle wrapping around the screen for the two horizontal gaps
            if (this.x < -this.radius) this.x = canvas.width + this.radius;
            if (this.x > canvas.width + this.radius) this.x = -this.radius;
        }

        checkWallCollision(x, y) {
            const margin = this.radius * 0.9;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const checkX = x + i * margin;
                    const checkY = y + j * margin;
                    const col = Math.floor(checkX / TILE_SIZE);
                    const row = Math.floor(checkY / TILE_SIZE);
                    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                        const tile = map[row][col];
                        if (tile === 1 || tile === 9) { // Wall or ghost house
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        
        eat() {
            const { row, col } = this.getGridPos();
            if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

            const tile = map[row][col];
            if (tile === 0) { // Standard Dot
                map[row][col] = 2; // Empty space
                score += 10;
                dotsEaten++;
            } else if (tile === 3) { // Power Pellet
                map[row][col] = 2; // Empty space
                score += 50;
                dotsEaten++;
                // Note: In this version, power pellets don't make ghosts vulnerable.
            }
            updateScoreUI();
        }
    }

    class Ghost extends Character {
        constructor(x, y, speed) {
            super(x, y, speed);
            this.dir = { x: 1, y: 0 }; // Start moving right
        }

        draw() {
            ctx.fillStyle = 'var(--ghost)';
            // Body
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, Math.PI, 0);
            ctx.lineTo(this.x + this.radius, this.y + this.radius);
            ctx.lineTo(this.x + this.radius * 0.5, this.y + this.radius * 0.7);
            ctx.lineTo(this.x, this.y + this.radius);
            ctx.lineTo(this.x - this.radius * 0.5, this.y + this.radius * 0.7);
            ctx.lineTo(this.x - this.radius, this.y + this.radius);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.4, this.y - this.radius * 0.2, this.radius * 0.2, 0, 2 * Math.PI);
            ctx.arc(this.x + this.radius * 0.4, this.y - this.radius * 0.2, this.radius * 0.2, 0, 2 * Math.PI);
            ctx.fill();
        }

        update() {
            this.handleMovement();
        }

        isAtIntersection() {
            // This logic is crucial for AI decisions.
            const centerOffset = this.speed / TILE_SIZE / 2;
            const xInTile = (this.x / TILE_SIZE) % 1;
            const yInTile = (this.y / TILE_SIZE) % 1;
            return Math.abs(xInTile - 0.5) < centerOffset && Math.abs(yInTile - 0.5) < centerOffset;
        }

        handleMovement() {
            if (this.isAtIntersection()) {
                this.dir = this.getChaseDirection();
                // Snap to grid to prevent getting stuck
                const { row, col } = this.getGridPos();
                this.x = col * TILE_SIZE + TILE_SIZE / 2;
                this.y = row * TILE_SIZE + TILE_SIZE / 2;
            }

            this.x += this.dir.x * this.speed;
            this.y += this.dir.y * this.speed;
        }

        // --- 5. Artificial Intelligence (AI) ---
        getChaseDirection() {
            const { row, col } = this.getGridPos();
            const possibleMoves = [];

            // Check potential moves: up, down, left, right
            const moves = [
                { x: 0, y: -1 }, // Up
                { x: 0, y: 1 },  // Down
                { x: -1, y: 0 }, // Left
                { x: 1, y: 0 }   // Right
            ];
            
            for (const move of moves) {
                // Rule: Ghost cannot reverse direction unless at a dead end
                if (move.x === -this.dir.x && move.y === -this.dir.y) {
                    continue;
                }

                const nextCol = col + move.x;
                const nextRow = row + move.y;

                if (nextRow >= 0 && nextRow < GRID_SIZE && nextCol >= 0 && nextCol < GRID_SIZE) {
                    const tile = map[nextRow][nextCol];
                    if (tile !== 1 && tile !== 9) { // Can't move into walls or ghost house
                        possibleMoves.push(move);
                    }
                }
            }

            // If stuck in a dead end, the only move is to reverse
            if (possibleMoves.length === 0) {
                return { x: -this.dir.x, y: -this.dir.y };
            }

            // --- Targeting Algorithm: Deterministic Chase ---
            let bestMove = possibleMoves[0];
            let minDistance = Infinity;

            for (const move of possibleMoves) {
                const nextCol = col + move.x;
                const nextRow = row + move.y;
                
                // Euclidean distance
                const distance = Math.sqrt(
                    Math.pow(player.getGridPos().col - nextCol, 2) +
                    Math.pow(player.getGridPos().row - nextRow, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    bestMove = move;
                }
            }
            return bestMove;
        }
    }

    // --- Game Setup & Initialization ---
    function init() {
        resizeCanvas();
        updateHighScoreUI();
        setupEventListeners();
    }
    
    function resetGame() {
        // Deep copy the initial map to the game map
        map = initialMap.map(arr => arr.slice());
        
        score = 0;
        dotsEaten = 0;
        totalDots = 0;
        map.forEach(row => {
            row.forEach(tile => {
                if (tile === 0 || tile === 3) totalDots++;
            });
        });

        // Reset player
        player = new Player(1 * TILE_SIZE + TILE_SIZE / 2, 1 * TILE_SIZE + TILE_SIZE / 2, PLAYER_SPEED);
        player.dir = {x: 0, y: 0};
        player.nextDir = {x: 0, y: 0};
    }

    function startGame(difficulty) {
        resetGame();
        lives = 3;
        updateLivesUI();
        
        const ghostSpeed = difficulty === 'easy' ? GHOST_SPEED_EASY : GHOST_SPEED_HARD;
        ghost = new Ghost(10.5 * TILE_SIZE, 8.5 * TILE_SIZE, ghostSpeed);
        
        startMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        
        gameState = 'playing';
        lastTime = 0; // Reset timer for the game loop
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        gameLoop();
    }

    // --- Main Game Loop ---
    function gameLoop(timestamp) {
        if (gameState !== 'playing') return;

        animationFrameId = requestAnimationFrame(gameLoop);
        const deltaTime = timestamp - lastTime;
        if (deltaTime < 16) return; // Cap at ~60 FPS
        lastTime = timestamp;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update & Draw
        drawMaze();
        player.update();
        player.draw();
        ghost.update();
        ghost.draw();
        
        // Check for game-ending conditions
        checkPlayerGhostCollision();
        checkWinCondition();
    }

    // --- Collision & Win/Loss Logic ---
    function checkPlayerGhostCollision() {
        const dx = player.x - ghost.x;
        const dy = player.y - ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + ghost.radius) {
            handleLifeLost();
        }
    }

    function handleLifeLost() {
        lives--;
        updateLivesUI();
        gameState = 'paused'; // Pause the game briefly

        if (lives <= 0) {
            endGame(false); // Lost
        } else {
            // Reset positions after a short delay
            setTimeout(() => {
                player.x = 1 * TILE_SIZE + TILE_SIZE / 2;
                player.y = 1 * TILE_SIZE + TILE_SIZE / 2;
                player.dir = {x: 0, y: 0};
                player.nextDir = {x: 0, y: 0};
                
                ghost.x = 10.5 * TILE_SIZE;
                ghost.y = 8.5 * TILE_SIZE;
                
                gameState = 'playing';
            }, 1500);
        }
    }

    function checkWinCondition() {
        if (dotsEaten >= totalDots) {
            endGame(true); // Won
        }
    }

    function endGame(isWin) {
        gameState = 'gameOver';
        cancelAnimationFrame(animationFrameId);
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pixelMuncherHighScore', highScore);
        }
        updateHighScoreUI();
        
        gameOverTitle.textContent = isWin ? "YOU WIN!" : "GAME OVER";
        finalScoreText.textContent = `FINAL SCORE: ${score}`;
        finalHighscoreText.textContent = `HIGH SCORE: ${highScore}`;
        gameOverMenu.classList.remove('hidden');
    }

    // --- Drawing Functions ---
    function drawMaze() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const tile = map[row][col];
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                if (tile === 1) { // Wall
                    ctx.fillStyle = 'var(--walls)';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                } else if (tile === 0) { // Standard Dot
                    ctx.fillStyle = 'var(--dots)';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.1, 0, 2 * Math.PI);
                    ctx.fill();
                } else if (tile === 3) { // Power Pellet
                    ctx.fillStyle = 'var(--pellets)';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.25, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }

    // --- UI Update Functions ---
    function updateScoreUI() {
        scoreEl.textContent = score;
    }

    function updateHighScoreUI() {
        highscoreEl.textContent = highScore;
    }

    function updateLivesUI() {
        livesEl.textContent = '♥'.repeat(lives);
    }

    // --- Event Listeners & Controls ---
    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        
        // Desktop Controls
        window.addEventListener('keydown', handleKeyDown);

        // Mobile Controls
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Menu Buttons
        startEasyBtn.addEventListener('click', () => startGame('easy'));
        startHardBtn.addEventListener('click', () => startGame('hard'));
        playAgainBtn.addEventListener('click', () => {
            gameOverMenu.classList.add('hidden');
            startMenu.classList.remove('hidden');
        });
    }
    
    function handleKeyDown(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();
        let newDir = null;
        switch(e.key) {
            case 'ArrowUp': case 'w': newDir = { x: 0, y: -1 }; break;
            case 'ArrowDown': case 's': newDir = { x: 0, y: 1 }; break;
            case 'ArrowLeft': case 'a': newDir = { x: -1, y: 0 }; break;
            case 'ArrowRight': case 'd': newDir = { x: 1, y: 0 }; break;
        }
        if (newDir) {
            player.nextDir = newDir;
        }
    }

    function handleTouchStart(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        if (gameState !== 'playing' || touchStartX === 0) return;
        e.preventDefault();
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Reset for next touch
        touchStartX = 0;
        touchStartY = 0;

        let newDir = null;
        if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
            if (Math.abs(dx) > 30) { // Swipe threshold
               newDir = { x: dx > 0 ? 1 : -1, y: 0 };
            }
        } else { // Vertical swipe
            if (Math.abs(dy) > 30) { // Swipe threshold
               newDir = { x: 0, y: dy > 0 ? 1 : -1 };
            }
        }
        if(newDir) {
            player.nextDir = newDir;
        }
    }

    // --- Canvas Sizing ---
    function resizeCanvas() {
        const container = document.getElementById('canvas-wrapper');
        const size = container.clientWidth;
        
        canvas.width = size;
        canvas.height = size;
        TILE_SIZE = canvas.width / GRID_SIZE;
        
        // If a game is in progress, redraw everything to scale
        if (gameState !== 'menu') {
            // We need to rescale character positions if the game is active
            if(player) {
                const oldTileSize = player.radius * 2.5;
                const scaleFactor = TILE_SIZE / oldTileSize;
                player.x *= scaleFactor;
                player.y *= scaleFactor;
                player.radius = TILE_SIZE / 2.5;
            }
            if(ghost) {
                const oldTileSize = ghost.radius * 2.5;
                const scaleFactor = TILE_SIZE / oldTileSize;
                ghost.x *= scaleFactor;
                ghost.y *= scaleFactor;
                ghost.radius = TILE_SIZE / 2.5;
            }
            
            // Redraw immediately after resize
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawMaze();
            if(player) player.draw();
            if(ghost) ghost.draw();
        }
    }

    // --- Start the engine ---
    init();
});
