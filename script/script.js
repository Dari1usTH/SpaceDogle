window.addEventListener('load', () => {
    if (sessionStorage.getItem('session_revives') === null) {
        sessionStorage.setItem('session_revives', '2');
    }
    revives = parseInt(sessionStorage.getItem('session_revives'), 10) || 0;
    
    if (localStorage.getItem('spacedogle_audio') !== null) {
        audioEnabled = localStorage.getItem('spacedogle_audio') === 'true';
    }
    
    applyAudioSettings();
    updateAudioButtonText();
    updateUI();
});

function createStars(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.opacity = Math.random() * 0.6 + 0.4;
        star.style.animation = `twinkle ${Math.random() * 10 + 5}s infinite alternate`;
        container.appendChild(star);
    }
}

const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const playButton = document.getElementById('playButton');
const refreshButton = document.getElementById('refreshButton');
const audioButton = document.getElementById('audioButton');
const moonshotButton = document.getElementById('moonshotButton');
const restartButton = document.getElementById('restartButton');
const backButton = document.getElementById('backButton');
const gameCanvas = document.getElementById('gameCanvas');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');
const menuStars = document.getElementById('menuStars');
const playerName = document.getElementById('playerName');
const reviveValue = document.getElementById('reviveValue');
const reviveGameOverButton = document.getElementById('reviveGameOverButton');
const reviveCount = document.getElementById('reviveCount');
const pauseButton = document.getElementById('pauseButton');
const pauseScreen = document.getElementById('pauseScreen');
const resumeButton = document.getElementById('resumeButton');

let shootSound = new Audio('../sounds/shoot.mp3');
shootSound.volume = 0.99;

let backgroundMusic = new Audio('../sounds/background.mp3');
backgroundMusic.volume = 0.2;
backgroundMusic.loop = true;

let audioEnabled = true;
let gamePaused = false;
let ctx;
let bestScore = 0;
let gameActive = false;
let score = 0;
let lives = 3;
let revives = 2;
let shieldActive = false;
let shieldEndTime = 0;
let reviveGivenOnHighScore = false;
let animationFrameId = null;

createStars(menuStars, 150);

pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', togglePause);

const ship = {
    x: 400,
    y: 500,
    width: 50,
    height: 60,
    speed: 7,
    color: '#00ccff'
};

let bullets = [];
let asteroids = [];
let asteroidSpawnRate = 60;
let asteroidFrameCount = 0;

let lastShotTime = 0;
const fireRateMs = 200;
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let keys = {};

playButton.addEventListener('click', startGame);
refreshButton.addEventListener('click', () => location.reload());
moonshotButton.addEventListener('click', () => window.open('https://moonshot.hackclub.com', '_blank'));
audioButton.addEventListener('click', toggleAudio);
restartButton.addEventListener('click', restartGame);
reviveGameOverButton.addEventListener('click', useRevive);
backButton.addEventListener('click', goBackToMenu);

function applyAudioSettings() {
    if (audioEnabled) {
        shootSound.volume = 0.99;
        backgroundMusic.volume = 0.2;
    } else {
        shootSound.volume = 0;
        backgroundMusic.volume = 0;
        backgroundMusic.pause();
    }
}

function updateAudioButtonText() {
    audioButton.textContent = audioEnabled ? 'Audio: ON' : 'Audio: OFF';
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    applyAudioSettings();
    updateAudioButtonText();
    
    if (audioEnabled && gameActive && !backgroundMusic.paused && !gamePaused) {
        backgroundMusic.play().catch(e => {});
    }
}

function maybePlayBackgroundMusic() {
    if (audioEnabled && gameActive && backgroundMusic.paused && !gamePaused) {
        backgroundMusic.play().catch(e => {});
    }
}

function startGame() {
    menuScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    pauseButton.style.display = 'block';
    pauseButton.textContent = '||';
    pauseButton.classList.remove('paused');
    
    setTimeout(() => {
        gameScreen.style.opacity = 1;
        initGame();
    }, 50);
}

function initGame() {
    ctx = gameCanvas.getContext('2d');
    score = 0;
    lives = 3;
    revives = parseInt(sessionStorage.getItem('session_revives'), 10) || revives;
    reviveGivenOnHighScore = false;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    asteroidSpawnRate = 80;
    updateUI();
    
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
    
    if (audioEnabled) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => {});
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function useRevive() {
    if (revives <= 0) return;
    
    revives--;
    sessionStorage.setItem('session_revives', revives);
    
    gameOverScreen.style.display = 'none';
    pauseButton.style.display = 'block';
    pauseButton.textContent = '||';
    pauseButton.classList.remove('paused');
    gamePaused = false;
    pauseScreen.style.display = 'none';
    
    lives = 3;
    
    shieldActive = true;
    shieldEndTime = Date.now() + 3000;
    asteroids = [];
    
    showReviveEffect();
    
    updateUI();
    
    gameActive = true;
    
    if (audioEnabled) {
        backgroundMusic.play().catch(e => {});
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function showReviveEffect() {
    const effect = document.createElement('div');
    effect.className = 'revive-feedback';
    effect.textContent = 'SHIELD ACTIVE!';
    effect.style.opacity = '1';
    
    document.getElementById('gameScreen').appendChild(effect);
    
    setTimeout(() => {
        effect.style.opacity = '0';
        setTimeout(() => {
            effect.remove();
        }, 500);
    }, 2000);
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    pauseButton.style.display = 'block';
    pauseButton.textContent = '||';
    pauseButton.classList.remove('paused');
    gamePaused = false;
    pauseScreen.style.display = 'none';

    score = 0;
    lives = 3;
    revives = parseInt(sessionStorage.getItem('session_revives'));
    reviveGivenOnHighScore = false;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    asteroidSpawnRate = 60;
    
    updateUI();
    gameActive = true;
    
    if (audioEnabled) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => {});
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function goBackToMenu() {
    gameActive = false;
    gamePaused = false;
    pauseScreen.style.display = 'none';
    pauseButton.classList.remove('paused');
    
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    score = 0;
    lives = 3;
    revives = parseInt(sessionStorage.getItem('session_revives'));
    reviveGivenOnHighScore = false;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    gameScreen.style.display = 'none';
    gameScreen.style.opacity = 0;
    gameOverScreen.style.display = 'none';
    menuScreen.style.display = 'flex';
    updateUI();
    
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    gameCanvas.removeEventListener('mousedown', handleMouseDown);
    gameCanvas.removeEventListener('mouseup', handleMouseUp);
    gameCanvas.removeEventListener('mousemove', handleMouseMove);
}

function updateUI() {
    scoreValue.textContent = score;
    livesValue.textContent = lives;
    reviveValue.textContent = revives;
    reviveCount.textContent = revives;
    
    if (revives <= 0) {
        reviveGameOverButton.disabled = true;
    } else {
        reviveGameOverButton.disabled = false;
    }
    
    if (score > bestScore && !reviveGivenOnHighScore && revives === 0) {
        bestScore = score;
        localStorage.setItem('spacedogle_bestScore', bestScore);
        document.getElementById('bestScoreValue').textContent = bestScore;
        
        revives = 1;
        sessionStorage.setItem('session_revives', revives);
        reviveGivenOnHighScore = true;
        
        updateUI();
    } else if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('spacedogle_bestScore', bestScore);
        document.getElementById('bestScoreValue').textContent = bestScore;
    }
}

function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === ' ' && gameActive) {
        e.preventDefault();
        if (canShootNow()) {
            shootWithSpace();
        }
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function handleMouseDown(e) {
    if (!gameActive) return;
    mouseDown = true;
    updateMousePosFromEvent(e);
    tryShootAt(mouseX, mouseY);
}

function handleMouseUp() {
    mouseDown = false;
}

function handleMouseMove(e) {
    updateMousePosFromEvent(e);
}

function updateMousePosFromEvent(e) {
    const rect = gameCanvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

function canShootNow() {
    return Date.now() - lastShotTime >= fireRateMs;
}

function tryShootAt(tx, ty) {
    if (!gameActive) return;
    if (!canShootNow()) return;
    doShootTowards(tx, ty);
}

function doShootTowards(targetX, targetY) {
    const dx = targetX - ship.x;
    const dy = targetY - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    bullets.push({
        x: ship.x,
        y: ship.y,
        vx: (dx / distance) * 10,
        vy: (dy / distance) * 10,
        radius: 4,
        color: '#ff00ff'
    });
    lastShotTime = Date.now();
    playShootSound();
}

function shootWithSpace() {
    if (!gameActive) return;
    if (!canShootNow()) return;
    bullets.push({
        x: ship.x,
        y: ship.y,
        vx: 0,
        vy: -10,
        radius: 4,
        color: '#ff00ff'
    });
    lastShotTime = Date.now();
    playShootSound();
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
            
            if (score >= 200 && score % 200 === 0) {
                asteroidSpawnRate = Math.max(asteroidSpawnRate - 15, 10);
            } else {
                if (asteroidSpawnRate > 20) {
                    asteroidSpawnRate -= 0.5;
                }
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
                if (asteroids[i].type === 'special') {
                    asteroids[i].hits++;
                    bullets.splice(j, 1);
                    
                    if (asteroids[i].hits >= asteroids[i].hitsNeeded) {
                        asteroids.splice(i, 1);
                        score += 50;
                        lives++;
                        updateUI();
                    }
                } else if (asteroids[i].type === 'powerup') {
                    asteroids.splice(i, 1);
                    bullets.splice(j, 1);
                    score += 25;
                    revives++;
                    sessionStorage.setItem('session_revives', revives);
                    updateUI();
                } else {
                    asteroids.splice(i, 1);
                    bullets.splice(j, 1);
                    score += 10;
                    updateUI();
                }
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

function spawnAsteroid() {
    const chance = Math.random();
    
    if (chance < 0.050) {
        const radius = Math.random() * 20 + 50;
        const hitsNeeded = Math.floor(Math.random() * 2) + 3;
        asteroids.push({
            x: Math.random() * (gameCanvas.width - radius * 2) + radius,
            y: -radius,
            vx: (Math.random() - 0.5) * 1,
            vy: Math.random() * 1.5 + 0.5,
            radius: radius,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            color: `hsl(${Math.random() * 30 + 10}, 90%, 50%)`,
            type: 'special',
            hits: 0,
            hitsNeeded: hitsNeeded
        });
    } else if (chance < 0.075) {
        const radius = Math.random() * 5 + 10;
        asteroids.push({
            x: Math.random() * (gameCanvas.width - radius * 2) + radius,
            y: -radius,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.8 + 0.2,
            radius: radius,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            color: '#ffff00',
            type: 'powerup'
        });
    } else {
        const radius = Math.random() * 30 + 20;
        asteroids.push({
            x: Math.random() * (gameCanvas.width - radius * 2) + radius,
            y: -radius,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            radius: radius,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            color: `hsl(${Math.random() * 60 + 20}, 70%, 50%)`,
            type: 'normal'
        });
    }
}

function gameLoop() {
    if (!gameActive) return;
    
    if (!gamePaused) {
        if (shieldActive && Date.now() > shieldEndTime) {
            shieldActive = false;
        }
        
        update();
        draw();
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.fillStyle = '#000015';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawStars();
    drawShip();
    drawBullets();
    drawAsteroids();
}

function drawStars() {
    if (!window.stars) {
        window.stars = [];
        for (let i = 0; i < 200; i++) {
            window.stars.push({
                x: Math.random() * gameCanvas.width,
                y: Math.random() * gameCanvas.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.7 + 0.3,
                speed: Math.random() * 0.3 + 0.1
            });
        }
    }
    ctx.fillStyle = 'white';
    window.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > gameCanvas.height) {
            star.y = 0;
            star.x = Math.random() * gameCanvas.width;
            star.size = Math.random() * 2 + 0.5;
            star.opacity = Math.random() * 0.7 + 0.3;
        }
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    
    if (shieldActive) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(ship.width, ship.height) / 2 + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
    
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -ship.height / 2);
    ctx.lineTo(ship.width / 3, ship.height / 3);
    ctx.lineTo(ship.width / 6, ship.height / 2);
    ctx.lineTo(-ship.width / 6, ship.height / 2);
    ctx.lineTo(-ship.width / 3, ship.height / 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(ship.width / 3, ship.height / 4);
    ctx.lineTo(ship.width / 2, ship.height / 2);
    ctx.lineTo(ship.width / 3, ship.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-ship.width / 3, ship.height / 4);
    ctx.lineTo(-ship.width / 2, ship.height / 2);
    ctx.lineTo(-ship.width / 3, ship.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ship.width / 6, ship.height / 2);
    ctx.lineTo(ship.width / 4, ship.height / 2 + 15);
    ctx.lineTo(0, ship.height / 2 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-ship.width / 6, ship.height / 2);
    ctx.lineTo(-ship.width / 4, ship.height / 2 + 15);
    ctx.lineTo(0, ship.height / 2 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, -ship.height / 6, ship.width / 5, ship.width / 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-ship.width / 4, -ship.height / 8);
    ctx.lineTo(-ship.width / 4, ship.height / 4);
    ctx.moveTo(ship.width / 4, -ship.height / 8);
    ctx.lineTo(ship.width / 4, ship.height / 4);
    ctx.stroke();
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(-ship.width / 5, ship.height / 3, ship.width / 8, 0, Math.PI * 2);
    ctx.arc(ship.width / 5, ship.height / 3, ship.width / 8, 0, Math.PI * 2);
    ctx.fill();
    if (Math.floor(Date.now() / 80) % 2 === 0) {
        const gradient = ctx.createLinearGradient(0, ship.height / 2, 0, ship.height / 2 + 40);
        gradient.addColorStop(0, '#ff3300');
        gradient.addColorStop(0.5, '#ff9900');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(-ship.width / 5, ship.height / 2 + 5, ship.width / 7, 25, 0, 0, Math.PI);
        ctx.ellipse(ship.width / 5, ship.height / 2 + 5, ship.width / 7, 25, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = Math.random() * 15;
            const size = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.arc(-ship.width / 5 + offsetX, ship.height / 2 + 10 + offsetY, size, 0, Math.PI * 2);
            ctx.arc(ship.width / 5 + offsetX, ship.height / 2 + 10 + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.fillStyle = Math.floor(Date.now() / 500) % 2 === 0 ? '#00ff00' : '#003300';
    ctx.beginPath();
    ctx.arc(-ship.width / 2.5, -ship.height / 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Math.floor(Date.now() / 500) % 2 === 1 ? '#ff0000' : '#330000';
    ctx.beginPath();
    ctx.arc(ship.width / 2.5, -ship.height / 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawAsteroids() {
    asteroids.forEach(asteroid => {
        if (asteroid.type === 'powerup') {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            
            ctx.fillStyle = asteroid.color;
            ctx.beginPath();
            
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const radius = asteroid.radius;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, asteroid.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const x1 = Math.cos(angle) * (asteroid.radius * 0.4);
                const y1 = Math.sin(angle) * (asteroid.radius * 0.4);
                const x2 = Math.cos(angle) * (asteroid.radius * 0.8);
                const y2 = Math.sin(angle) * (asteroid.radius * 0.8);
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
            ctx.restore();
        } else if (asteroid.type === 'special') {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            ctx.fillStyle = asteroid.color;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radiusVariation = 0.7 + Math.random() * 0.3;
                const x = Math.cos(angle) * asteroid.radius * radiusVariation;
                const y = Math.sin(angle) * asteroid.radius * radiusVariation;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, asteroid.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${asteroid.hitsNeeded - asteroid.hits}`, 0, 0);
            
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            ctx.fillStyle = asteroid.color;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radiusVariation = 0.7 + Math.random() * 0.3;
                const x = Math.cos(angle) * asteroid.radius * radiusVariation;
                const y = Math.sin(angle) * asteroid.radius * radiusVariation;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(-asteroid.radius / 3, -asteroid.radius / 4, asteroid.radius / 4, 0, Math.PI * 2);
            ctx.arc(asteroid.radius / 3, asteroid.radius / 4, asteroid.radius / 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });
}

function gameOver() {
    gameActive = false;
    finalScore.textContent = score;
    
    backgroundMusic.pause();
    
    if (revives > 0) {
        reviveGameOverButton.style.display = 'block';
    } else {
        reviveGameOverButton.style.display = 'none';
    }
    
    gameOverScreen.style.display = 'flex';
    backButton.style.display = 'block';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
});

function togglePause() {
    if (!gameActive || lives <= 0) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        pauseScreen.style.display = 'flex';
        pauseButton.textContent = '▮';
        pauseButton.classList.add('paused');
        
        if (audioEnabled) {
            backgroundMusic.pause();
        }
    } else {
        pauseScreen.style.display = 'none';
        pauseButton.textContent = '||';
        pauseButton.classList.remove('paused');
        
        shieldActive = true;
        shieldEndTime = Date.now() + 3000;
        
        if (audioEnabled) {
            backgroundMusic.play().catch(e => {});
        }
    }
}

function playShootSound() {
    if (shootSound) {
        shootSound.currentTime = 0;
        shootSound.play().catch(e => {});
    }
}