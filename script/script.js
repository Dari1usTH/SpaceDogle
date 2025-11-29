function createStars(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.opacity = Math.random();
        container.appendChild(star);
    }
}

const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const playButton = document.getElementById('playButton');
const resetButton = document.getElementById('resetButton');
const settingsButton = document.getElementById('settingsButton');
const extraButton = document.getElementById('extraButton');
const restartButton = document.getElementById('restartButton');
const backButton = document.getElementById('backButton');
const gameCanvas = document.getElementById('gameCanvas');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');
const menuStars = document.getElementById('menuStars');

createStars(menuStars, 150);

let ctx;
let gameActive = false;
let score = 0;
let lives = 3;

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

playButton.addEventListener('click', startGame);
resetButton.addEventListener('click', () => alert('Reset Button - Feature in development'));
settingsButton.addEventListener('click', () => alert('Settings Button - Feature in development'));
extraButton.addEventListener('click', () => alert('Bonus Button - Feature in development'));
restartButton.addEventListener('click', restartGame);
backButton.addEventListener('click', goBackToMenu);

function initGame() {
    ctx = gameCanvas.getContext('2d');
    
    score = 0;
    lives = 3;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    
    updateUI();
    
    const savedUsername = localStorage.getItem('spacedogle_username');
    if (savedUsername) {
        playerName.textContent = savedUsername;
    }
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    gameCanvas.addEventListener('click', shoot);
    
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

function startGame() {
    menuScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    backButton.style.display = 'block';
    const gameUI = document.querySelector('.gameUI');
    gameUI.style.left = '150px'; 
    
    setTimeout(() => {
        gameScreen.style.opacity = 1;
        initGame();
    }, 50);
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    backButton.style.display = 'block';
    initGame();
}

function goBackToMenu() {
    gameActive = false;
    score = 0;
    lives = 3;
    bullets = [];
    asteroids = [];
    asteroidFrameCount = 0;
    gameScreen.style.display = 'none';
    gameScreen.style.opacity = 0;
    gameOverScreen.style.display = 'none';
    menuScreen.style.display = 'flex';
    updateUI();
}

function updateUI() {
    scoreValue.textContent = score;
    livesValue.textContent = lives;
}

let keys = {};

function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === ' ' && gameActive) {
        e.preventDefault(); 
        shootWithSpace();
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function shoot(e) {
    if (!gameActive) return;
    
    const rect = gameCanvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    const dx = targetX - ship.x;
    const dy = targetY - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    bullets.push({
        x: ship.x,
        y: ship.y,
        vx: (dx / distance) * 10,
        vy: (dy / distance) * 10,
        radius: 4,
        color: '#ff00ff'
    });
}

function update() {
    if ((keys['ArrowLeft'] || keys['a']) && ship.x > ship.width/2) {
        ship.x -= ship.speed;
    }
    if ((keys['ArrowRight'] || keys['d']) && ship.x < gameCanvas.width - ship.width/2) {
        ship.x += ship.speed;
    }
    if ((keys['ArrowUp'] || keys['w']) && ship.y > ship.height/2) {
        ship.y -= ship.speed;
    }
    if ((keys['ArrowDown'] || keys['s']) && ship.y < gameCanvas.height - ship.height/2) {
        ship.y += ship.speed;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        
        if (bullets[i].x < 0 || bullets[i].x > gameCanvas.width || 
            bullets[i].y < 0 || bullets[i].y > gameCanvas.height) {
            bullets.splice(i, 1);
        }
    }

    asteroidFrameCount++;
    if (asteroidFrameCount >= asteroidSpawnRate) {
        spawnAsteroid();
        asteroidFrameCount = 0;
        
        if (asteroidSpawnRate > 20) {
            asteroidSpawnRate -= 0.5;
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

function spawnAsteroid() {
    const radius = Math.random() * 30 + 20;
    asteroids.push({
        x: Math.random() * (gameCanvas.width - radius * 2) + radius,
        y: -radius,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        radius: radius,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        color: `hsl(${Math.random() * 60 + 20}, 70%, 50%)`
    });
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
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
        const x = (i * 13) % gameCanvas.width;
        const y = (i * 7) % gameCanvas.height;
        const size = Math.sin(Date.now() / 1000 + i) * 1.5 + 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -ship.height/2);
    ctx.lineTo(ship.width/3, ship.height/3);
    ctx.lineTo(ship.width/6, ship.height/2);
    ctx.lineTo(-ship.width/6, ship.height/2);
    ctx.lineTo(-ship.width/3, ship.height/3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(ship.width/3, ship.height/4);
    ctx.lineTo(ship.width/2, ship.height/2);
    ctx.lineTo(ship.width/3, ship.height/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-ship.width/3, ship.height/4);
    ctx.lineTo(-ship.width/2, ship.height/2);
    ctx.lineTo(-ship.width/3, ship.height/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(ship.width/6, ship.height/2);
    ctx.lineTo(ship.width/4, ship.height/2 + 15);
    ctx.lineTo(0, ship.height/2 + 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-ship.width/6, ship.height/2);
    ctx.lineTo(-ship.width/4, ship.height/2 + 15);
    ctx.lineTo(0, ship.height/2 + 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, -ship.height/6, ship.width/5, ship.width/8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-ship.width/4, -ship.height/8);
    ctx.lineTo(-ship.width/4, ship.height/4);
    ctx.moveTo(ship.width/4, -ship.height/8);
    ctx.lineTo(ship.width/4, ship.height/4);
    ctx.stroke();
    
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(-ship.width/5, ship.height/3, ship.width/8, 0, Math.PI * 2);
    ctx.arc(ship.width/5, ship.height/3, ship.width/8, 0, Math.PI * 2);
    ctx.fill();
    
    if (Math.floor(Date.now() / 80) % 2 === 0) {
        const gradient = ctx.createLinearGradient(0, ship.height/2, 0, ship.height/2 + 40);
        gradient.addColorStop(0, '#ff3300');
        gradient.addColorStop(0.5, '#ff9900');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(-ship.width/5, ship.height/2 + 5, ship.width/7, 25, 0, 0, Math.PI);
        ctx.ellipse(ship.width/5, ship.height/2 + 5, ship.width/7, 25, 0, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = Math.random() * 15;
            const size = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.arc(-ship.width/5 + offsetX, ship.height/2 + 10 + offsetY, size, 0, Math.PI * 2);
            ctx.arc(ship.width/5 + offsetX, ship.height/2 + 10 + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.fillStyle = Math.floor(Date.now() / 500) % 2 === 0 ? '#00ff00' : '#003300';
    ctx.beginPath();
    ctx.arc(-ship.width/2.5, -ship.height/8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = Math.floor(Date.now() / 500) % 2 === 1 ? '#ff0000' : '#330000';
    ctx.beginPath();
    ctx.arc(ship.width/2.5, -ship.height/8, 3, 0, Math.PI * 2);
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
        ctx.arc(-asteroid.radius/3, -asteroid.radius/4, asteroid.radius/4, 0, Math.PI * 2);
        ctx.arc(asteroid.radius/3, asteroid.radius/4, asteroid.radius/5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function gameOver() {
    gameActive = false;
    finalScore.textContent = score;
    gameOverScreen.style.display = 'flex';
    backButton.style.display = 'block';
}

function gameLoop() {
    if (!gameActive) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function shootWithSpace() {
    if (!gameActive) return;
    bullets.push({
        x: ship.x,
        y: ship.y,
        vx: 0,
        vy: -10, 
        radius: 4,
        color: '#ff00ff'
    });
}
