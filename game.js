const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    speed: 5,
    color: 'blue',
};

// Enemy object
const enemies = [{
    x: 100, // Starting position of the enemy
    y: 100,
    width: 30,
    height: 30,
    color: 'red',
    shootCooldown: 1000, // Time between shots in milliseconds
    lastShot: Date.now() // Track when the enemy last shot
}];

// Array to store projectiles
const projectiles = [];

// Define the level transition area
const levelTransition = {
    x: canvas.width - 50,
    y: canvas.height / 2 - 50,
    width: 50,
    height: 100,
};

// Key tracking
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Function to check for level transition
function checkLevelTransition() {
    if (
        player.x < levelTransition.x + levelTransition.width &&
        player.x + player.width > levelTransition.x &&
        player.y < levelTransition.y + levelTransition.height &&
        player.y + player.height > levelTransition.y
    ) {
        window.location.href = 'level2.html';
    }
}

// Function to shoot projectiles
function shootProjectile(enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    
    const speed = 5; // Speed of the projectile
    projectiles.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        radius: 5, // Radius of the projectile
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
    });
}

// Function to update enemies
function updateEnemies() {
    enemies.forEach(enemy => {
        if (Date.now() - enemy.lastShot > enemy.shootCooldown) {
            shootProjectile(enemy);
            enemy.lastShot = Date.now(); // Update last shot time
        }
    });
}

// Function to update projectiles
function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx; // Move projectile
        projectile.y += projectile.dy;

        // Check for collision with the player
        if (
            projectile.x < player.x + player.width &&
            projectile.x + projectile.radius * 2 > player.x &&
            projectile.y < player.y + player.height &&
            projectile.y + projectile.radius * 2 > player.y
        ) {
            // Player hit, redirect to level 1
            window.location.href = 'index.html'; // Redirect back to level 1
        }

        // Remove projectiles that go off-screen
        if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
            projectiles.splice(index, 1); // Remove projectile
        }
    });
}

function update() {
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // Keep player within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Check for level transition
    checkLevelTransition();
    
    // Update enemies and projectiles
    updateEnemies();
    updateProjectiles();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw the level transition area
    ctx.fillStyle = 'red'; // Color for the transition area
    ctx.fillRect(levelTransition.x, levelTransition.y, levelTransition.width, levelTransition.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
