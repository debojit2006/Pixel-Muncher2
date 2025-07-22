// JavaScript logic based on the project specification
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const livesEl = document.getElementById('lives');
    
    const startMenu = document.getElementById('start-menu');
    const gameOverMenu = document.getElementById('game-over-menu');
    const startEasyBtn = document.getElementById('start-easy');
    const startHardBtn = document.getElementById('start-hard');
    const playAgainBtn = document.getElementById('play-again');
    const gameOverTitle = document.getElementById('game-over-title');
    const finalScoreEl = document.getElementById('final-score');
    const finalHighScoreEl = document.getElementById('final-high-score');

    // The game's map layout
    const grid = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 9, 9, 9, 9, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 9, 9, 9, 9, 1, 0, 0, 0, 0, 3, 0, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 1],
        [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    
    const TILE_SIZE = 20; // The logical size of a tile in the grid array
    const V = 4; // Base speed unit
    
    let tileSize; // The actual pixel size of a tile on the canvas
    let player, ghost;
    let score, highScore, lives;
    let difficulty;
    let gameState = 'menu'; // menu, playing, paused, gameOver
    let totalDots = 0;
    let originalGrid = JSON.parse(JSON.stringify(grid)); // Deep copy for resetting the game

    // --- Game Objects ---
    class Character {
        constructor(x, y, radius, color) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.direction = { x: 0, y: 0 };
            this.nextDirection = { x: 0, y: 0 };
            this.speed = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }

        update() {
            // Input buffering: change direction if possible
            if (this.canChangeDirection(this.nextDirection)) {
                this.direction = { ...this.nextDirection };
            }
            
            const nextX = this.x + this.direction.x * this.speed;
            const nextY = this.y + this.direction.y * this.speed;

            // Move if the path is clear
            if (!this.checkWallCollision(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            }
        }

        checkWallCollision(x, y) {
            const buffer = this.radius * 0.9; // Check points around the character's circumference
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const gridX = Math.floor((x + i * buffer) / tileSize);
                    const gridY = Math.floor((y + j * buffer) / tileSize);
                    if (grid[gridY] && (grid[gridY][gridX] === 1 || grid[gridY][gridX] === 9)) {
                        return true; // Collision with a wall or ghost house
                    }
                }
            }
            return false;
        }
        
        canChangeDirection(dir) {
            if (dir.x === 0 && dir.y === 0) return false;
            
            const currentTileX = Math.round(this.x / tileSize);
            const currentTileY = Math.round(this.y / tileSize);
            
            // Check if the character is close enough to the center of a tile to turn
            const isAtIntersection = Math.abs(this.x - (currentTileX * tileSize + tileSize / 2)) < this.speed &&
                                     Math.abs(this.y - (currentTileY * tileSize + tileSize / 2)) < this.speed;

            if (!isAtIntersection) return false;
            
            const nextGridX = currentTileX + dir.x;
            const nextGridY = currentTileY + dir.y;
            
            // Check if the next tile in the desired direction is not a wall
            return grid[nextGridY] && grid[nextGridY][nextGridX] !== 1 && grid[nextGridY][nextGridX] !== 9;
        }
    }
    
    class Ghost extends Character {
         update() {
            this.aiMove();
            super.update();
        }

        aiMove() {
            const currentTileX = Math.round(this.x / tileSize);
            const currentTileY = Math.round(this.y / tileSize);

            // Check if the ghost is at the center of a tile to make a decision
            const isAtIntersection = Math.abs(this.x - (currentTileX * tileSize + tileSize/2)) < this.speed &&
                                     Math.abs(this.y - (currentTileY * tileSize + tileSize/2)) < this.speed;

            if (isAtIntersection) {
                const possibleMoves = [];
                const directions = [
                    { x: 0, y: -1 }, // Up
                    { x: 0, y: 1 },  // Down
                    { x: -1, y: 0 }, // Left
                    { x: 1, y: 0 }   // Right
                ];

                for (const move of directions) {
                    // AI rule: Don't reverse direction unless at a dead end
                    if (move.x === -this.direction.x && move.y === -this.direction.y) {
                        continue;
                    }
                    
                    const nextGridX = currentTileX + move.x;
                    const nextGridY = currentTileY + move.y;

                    // Check if the potential move is valid (not a wall)
                    if (grid[nextGridY] && grid[nextGridY][nextGridX] !== 1 && grid[nextGridY][nextGridX] !== 9) {
                        // Calculate Euclidean distance to the player
                        const dist = Math.hypot(
                            (nextGridX * tileSize) - player.x,
                            (nextGridY * tileSize) - player.y
                        );
                        possibleMoves.push({ move, dist });
                    }
                }
                
                if (possibleMoves.length > 0) {
                    // Sort moves by distance to find the shortest path
                    possibleMoves.sort((a, b) => a.dist - b.dist);
                    this.direction = possibleMoves[0].move;
                } else { // Dead end, must reverse
                     this.direction.x *= -1;
                     this.direction.y *= -1;
                }
            }
        }
    }

    // --- Game Setup & State ---
    function init() {
        resizeCanvas();
        highScore = localStorage.getItem('pixelMuncherHighScore') || 0;
        updateUI();
    }

    function startGame(selectedDifficulty) {
        difficulty = selectedDifficulty;
        gameState = 'playing';
        startMenu.style.display = 'none';
        gameOverMenu.style.display = 'none';
        
        resetGame();
        gameLoop();
    }
    
    function resetGame() {
        score = 0;
        lives = 3;
        // Restore the grid to its original state with all dots
        for(let i = 0; i < grid.length; i++) {
            grid[i] = [...originalGrid[i]];
        }
        totalDots = grid.flat().filter(tile => tile === 0 || tile === 3).length;
        resetCharacters();
        updateUI();
    }
    
    function resetCharacters() {
        player = new Character(tileSize * 1.5, tileSize * 1.5, tileSize * 0.4, getCssVar('--player-color'));
        player.speed = 0.8 * V;
        
        ghost = new Ghost(tileSize * 10.5, tileSize * 8.5, tileSize * 0.4, getCssVar('--ghost-color'));
        ghost.speed = difficulty === 'easy' ? 0.75 * V * 0.75 : 0.75 * V * 1.25;
        ghost.direction = { x: 1, y: 0 };
    }

    function updateUI() {
        scoreEl.textContent = `SCORE: ${score}`;
        highScoreEl.textContent = `HIGH SCORE: ${highScore}`;
        livesEl.textContent = 'LIVES: ' + '♥ '.repeat(lives);
    }
    
    function loseLife() {
        lives--;
        gameState = 'paused';
        updateUI();
        
        if (lives <= 0) {
            endGame(false); // Game over
        } else {
            // Pause briefly before resetting positions
            setTimeout(() => {
                resetCharacters();
                gameState = 'playing';
            }, 2000); // 2-second pause
        }
    }
    
    function endGame(isWin) {
        gameState = 'gameOver';
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pixelMuncherHighScore', highScore);
        }
        
        gameOverTitle.textContent = isWin ? "YOU WIN!" : "GAME OVER";
        finalScoreEl.textContent = `YOUR SCORE: ${score}`;
        finalHighScoreEl.textContent = `HIGH SCORE: ${highScore}`;
        gameOverMenu.style.display = 'flex';
    }

    // --- Drawing & Rendering ---
    function draw() {
        // Clear the canvas for the new frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawGrid();
        player.draw();
        ghost.draw();
    }

    function drawGrid() {
        const wallColor = getCssVar('--wall-color');
        const dotColor = getCssVar('--dot-color');
        const pelletColor = getCssVar('--power-pellet-color');

        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const tile = grid[y][x];
                if (tile === 1) { // Wall
                    ctx.fillStyle = wallColor;
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                } else if (tile === 0) { // Standard Dot
                    ctx.beginPath();
                    ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize * 0.15, 0, Math.PI * 2);
                    ctx.fillStyle = dotColor;
                    ctx.fill();
                } else if (tile === 3) { // Power Pellet
                    ctx.beginPath();
                    ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize * 0.3, 0, Math.PI * 2);
                    ctx.fillStyle = pelletColor;
                    ctx.fill();
                }
            }
        }
    }

    // --- Game Logic ---
    function update() {
        if (gameState !== 'playing') return;
        player.update();
        ghost.update();
        checkCollisions();
        checkWinCondition();
    }

    function checkCollisions() {
        // Player with dots/pellets
        const playerGridX = Math.floor(player.x / tileSize);
        const playerGridY = Math.floor(player.y / tileSize);
        
        if (grid[playerGridY] && grid[playerGridY][playerGridX] !== undefined) {
             const tile = grid[playerGridY][playerGridX];

            if (tile === 0) { // Standard Dot
                grid[playerGridY][playerGridX] = 2; // Mark as empty space
                score += 10;
                totalDots--;
                updateUI();
            } else if (tile === 3) { // Power Pellet
                grid[playerGridY][playerGridX] = 2;
                score += 50;
                totalDots--;
                updateUI();
                // Future power-up logic can be added here
            }
        }
        
        // Player with ghost
        const dist = Math.hypot(player.x - ghost.x, player.y - ghost.y);
        if (dist < player.radius + ghost.radius) {
            loseLife();
        }
    }
    
    function checkWinCondition() {
        if (totalDots <= 0) {
            endGame(true); // Player wins
        }
    }

    // --- Main Game Loop ---
    function gameLoop() {
        update();
        draw();
        // Continue the loop as long as the game is not over
        if (gameState !== 'gameOver') {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // --- Event Listeners & Controls ---
    function handleKeyDown(e) {
        if (gameState !== 'playing') return;
        const key = e.key;
        let nextDir = { x: 0, y: 0 };
        if (key === 'ArrowUp' || key.toLowerCase() === 'w') nextDir = { x: 0, y: -1 };
        if (key === 'ArrowDown' || key.toLowerCase() === 's') nextDir = { x: 0, y: 1 };
        if (key === 'ArrowLeft' || key.toLowerCase() === 'a') nextDir = { x: -1, y: 0 };
        if (key === 'ArrowRight' || key.toLowerCase() === 'd') nextDir = { x: 1, y: 0 };
        
        if(nextDir.x !== 0 || nextDir.y !== 0) {
            player.nextDirection = nextDir;
        }
    }
    
    let touchStartX, touchStartY;
    function handleTouchStart(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
    
    function handleTouchEnd(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        let nextDir = { x: 0, y: 0 };
        if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
            nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else { // Vertical swipe
            nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }
        
        if(nextDir.x !== 0 || nextDir.y !== 0) {
            player.nextDirection = nextDir;
        }
    }

    // --- Utility Functions ---
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        const size = container.clientWidth;
        canvas.width = size;
        canvas.height = size;
        tileSize = canvas.width / TILE_SIZE; // Recalculate tile size for rendering
        if(gameState !== 'menu') {
            draw(); // Redraw static elements on resize
        }
    }
    
    function getCssVar(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    // --- Initial Setup ---
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    startEasyBtn.addEventListener('click', () => startGame('easy'));
    startHardBtn.addEventListener('click', () => startGame('hard'));
    playAgainBtn.addEventListener('click', () => {
        gameOverMenu.style.display = 'none';
        startMenu.style.display = 'flex';
    });

    init();
});
