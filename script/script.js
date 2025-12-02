const reviveButton = document.getElementById('reviveButton');
const reviveValue = document.getElementById('reviveValue');

let revives = 2;
let gameActive = false;
let score = 0;
let lives = 3;
let shieldActive = false;
let shieldEndTime = 0;
let reviveGivenOnHighScore = false;

function initGame() {
    ctx = gameCanvas.getContext('2d');
    score = 0;
    lives = 3;
    revives = parseInt(localStorage.getItem('spacedogle_revives')) || 2;
    reviveGivenOnHighScore = false;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    updateUI();
    
    reviveButton.style.display = 'block';
    
    const savedUsername = localStorage.getItem('spacedogle_username');
    if (savedUsername) {
        playerName.textContent = savedUsername;
    }
    bestScore = parseInt(localStorage.getItem('spacedogle_bestScore')) || 0;
    document.getElementById('bestScoreValue').textContent = bestScore;
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    gameCanvas.addEventListener('mousedown', handleMouseDown);
    gameCanvas.addEventListener('mouseup', handleMouseUp);
    gameCanvas.addEventListener('mousemove', handleMouseMove);
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

function useRevive() {
    if (revives <= 0 || !gameActive) return;

    revives--;
    localStorage.setItem('spacedogle_revives', revives);
    gameOverScreen.style.display = 'none';
    backButton.style.display = 'block';
    const gameUI = document.querySelector('.gameUI');
    gameUI.style.left = '150px';
    lives = 3;
    shieldActive = true;
    shieldEndTime = Date.now() + 3000;
    updateUI();
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    scoreValue.textContent = score;
    livesValue.textContent = lives;
    reviveValue.textContent = revives;
    reviveButton.textContent = `REVIVE (${revives})`;
    
    if (revives <= 0) {
        reviveButton.disabled = true;
    } else {
        reviveButton.disabled = false;
    }
    
    if (score > bestScore && !reviveGivenOnHighScore && revives === 0) {
        bestScore = score;
        localStorage.setItem('spacedogle_bestScore', bestScore);
        document.getElementById('bestScoreValue').textContent = bestScore;
 
        revives = 1;
        localStorage.setItem('spacedogle_revives', revives);
        reviveGivenOnHighScore = true;
        
        updateUI();
    } else if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('spacedogle_bestScore', bestScore);
        document.getElementById('bestScoreValue').textContent = bestScore;
    }
}

function gameOver() {
    gameActive = false;
    finalScore.textContent = score;
    
    if (revives > 0) {
        restartButton.textContent = `REVIVE (${revives})`;
    } else {
        restartButton.textContent = 'PLAY AGAIN';
    }
    
    gameOverScreen.style.display = 'flex';
    backButton.style.display = 'block';
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    backButton.style.display = 'block';
    const gameUI = document.querySelector('.gameUI');
    gameUI.style.left = '150px';

    score = 0;
    lives = 3;
    revives = parseInt(localStorage.getItem('spacedogle_revives')) || 2;
    reviveGivenOnHighScore = false;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    asteroidSpawnRate = 60;
    
    updateUI();
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameActive) return;
    
    if (shieldActive && Date.now() > shieldEndTime) {
        shieldActive = false;
    }
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if ((keys['ArrowLeft'] || keys['a']) && ship.x > ship.width / 2) {
        ship.x -= ship.speed;
    }
    if ((keys['ArrowRight'] || keys['d']) && ship.x < gameCanvas.width - ship.width / 2) {
        ship.x += ship.speed;
    }
    if ((keys['ArrowUp'] || keys['w']) && ship.y > ship.height / 2) {
        ship.y -= ship.speed;
    }
    if ((keys['ArrowDown'] || keys['s']) && ship.y < gameCanvas.height - ship.height / 2) {
        ship.y += ship.speed;
    }

    if ((keys[' '] || keys['Space']) && gameActive) {
        if (canShootNow()) shootWithSpace();
    }

    if (mouseDown && gameActive) {
        tryShootAt(mouseX, mouseY);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        if (bullets[i].x < 0 || bullets[i].x > gameCanvas.width || bullets[i].y < 0 || bullets[i].y > gameCanvas.height) {
            bullets.splice(i, 1);
        }
    }

    if (!shieldActive) {
        asteroidFrameCount++;
        if (asteroidFrameCount >= asteroidSpawnRate) {
            spawnAsteroid();
            asteroidFrameCount = 0;
            if (asteroidSpawnRate > 20) {
                asteroidSpawnRate -= 0.5;
            }
        }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].x += asteroids[i].vx;
        asteroids[i].y += asteroids[i].vy;
        asteroids[i].rotation += asteroids[i].rotationSpeed;
        if (asteroids[i].y > gameCanvas.height + 50) {
            asteroids.splice(i, 1);
        }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const dx = asteroids[i].x - bullets[j].x;
            const dy = asteroids[i].y - bullets[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < asteroids[i].radius + bullets[j].radius) {
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                updateUI();
                break;
            }
        }
    }

    if (!shieldActive) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const dx = asteroids[i].x - ship.x;
            const dy = asteroids[i].y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < asteroids[i].radius + Math.max(ship.width, ship.height) / 2) {
                asteroids.splice(i, 1);
                lives--;
                updateUI();
                if (lives <= 0) {
                    gameOver();
                }
                break;
            }
        }
    }
}

reviveButton.addEventListener('click', useRevive);

restartButton.addEventListener('click', function() {
    if (revives > 0) {
        useRevive();
    } else {
        restartGame();
    }
});