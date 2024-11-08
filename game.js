const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Optionally adjust player position or other game elements here if needed
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();  // Initial call to set the canvas size
let player = {
    x: 50,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    bullets: [],
    shieldCount: 0,
    speed: 5,
    color: 'blue'
};

let keys = {};
let enemies = [];
let score = 0;
let enemySpawnTimer = 0;
let playerHealth = 100;
let mouseX = 0;
let mouseY = 0;
let level = 1;
let levelScoreThreshold = 100;
let levelUpMessage = "";
let levelUpMessageTimer = 0;
const bulletSpeed = 8;
let bulletSize = 10;
let bulletColor = 'yellow';
let powerUps = []; // Array to store active power-ups
let upgradeCount = 0; // Tracks number of upgrades collected
let powerUpDroppedThisLevel = false;  // Track if a power-up has been dropped in the current level

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', () => shootBullet(mouseX, mouseY));

function movePlayer() {
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;
}

function shootBullet(targetX, targetY) {
    const dx = targetX - (player.x + player.width / 2);
    const dy = targetY - (player.y + player.height / 2);
    const angle = Math.atan2(dy, dx);

    // Adjust behavior based on upgrade level
    if (upgradeCount === 1) {
        // Double shooting pattern: Two bullets from slightly different x-positions
        const offset = 10;  // Offset for spacing the two bullets
        const bullet1 = createBullet(player.x + player.width / 2 - offset, player.y + player.height / 2, angle);
        const bullet2 = createBullet(player.x + player.width / 2 + offset, player.y + player.height / 2, angle);
        player.bullets.push(bullet1, bullet2);
    } else if (upgradeCount === 2) {
        // Double bullet size
        const bullet = createBullet(player.x + player.width / 2, player.y + player.height / 2, angle);
        bullet.width = bullet.height = 20;
        player.bullets.push(bullet);
    } else if (upgradeCount === 3) {
        // Multi-directional shooting: x, y, and diagonal axes
        const angles = [angle, angle + Math.PI / 4, angle - Math.PI / 4, angle + Math.PI / 2, angle - Math.PI / 2];
        angles.forEach(ang => player.bullets.push(createBullet(player.x + player.width / 2, player.y + player.height / 2, ang)));
    } else if (upgradeCount === 4) {
        // Homing bullets: slight adjustment of each bullet to target nearest enemy
        const bullet = createBullet(player.x + player.width / 2, player.y + player.height / 2, angle);
        bullet.homing = true;
        player.bullets.push(bullet);
    } else if (upgradeCount === 5) {
        // Continuous laser (could add a mechanism to create a laser effect)
        // Placeholder: Single continuous bullet with constant velocity
        const bullet = createBullet(player.x + player.width / 2, player.y + player.height / 2, angle);
        bullet.isLaser = true;
        player.bullets.push(bullet);
    } else {
        // Default single bullet
        const bullet = createBullet(player.x + player.width / 2, player.y + player.height / 2, angle);
        player.bullets.push(bullet);
    }
}

function createBullet(x, y, angle) {
    return {
        x: x,
        y: y,
        width: bulletSize,
        height: bulletSize,
        vx: bulletSpeed * Math.cos(angle),
        vy: bulletSpeed * Math.sin(angle),
        color: bulletColor
    };
}


function updateBullets() {
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x > canvas.width || bullet.x < 0 || bullet.y > canvas.height || bullet.y < 0) {
            player.bullets.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    enemies.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 50),
        width: 50,
        height: 50,
        speed: 3 + level * 0.5,
        color: 'red',
        health: level >= 6 ? 2 : 1  // Give enemies 2 health if level >= 6
    });
}


function spawnPowerUp(x, y) {
    powerUps.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        type: upgradeCount + 1,  // Each power-up corresponds to the next upgrade
        color: 'purple'          // Color to indicate power-up visually
    });
}

function applyShootingUpgrade() {
    switch (upgradeCount) {
        case 1:
            // Double shooting pattern: two bullets from slightly different positions
            bulletColor = 'yellow';  // Optional: color change for visual feedback
            break;
        case 2:
            // Double bullet size
            bulletSize = 20;
            break;
        case 3:
            // Shoot from two positions on x, y, and diagonal axes
            bulletColor = 'orange';
            break;
        case 4:
            // Homing bullets (we'll address homing behavior within shootBullet)
            bulletColor = 'green';
            break;
        case 5:
            // Continuous laser (we'll handle this separately)
            bulletColor = 'red';
            break;
    }
}


function updateEnemies() {
    enemySpawnTimer++;
    if (enemySpawnTimer > Math.max(30, 60 - level * 5)) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x -= enemy.speed;

        // If the enemy moves off-screen, remove it and decrease player health
        if (enemy.x + enemy.width < 0) {
            enemies.splice(i, 1);
            playerHealth -= 20;
            if (playerHealth <= 0) gameOver();
            continue;
        }

        // Check for collision between player and enemy
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            enemies.splice(i, 1);  // Remove enemy on collision with player

            // Check if player has a shield; otherwise, reduce health
            if (player.shieldCount > 0) {
                player.shieldCount--;
            } else {
                playerHealth -= 20;
                if (playerHealth <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }

    // Dropping a power-up after an enemy is defeated on specific levels
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Remove the enemy if it's hit by any of the player's bullets
        for (let j = player.bullets.length - 1; j >= 0; j--) {
            const bullet = player.bullets[j];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Remove the enemy and bullet upon collision
                enemies.splice(i, 1);
                player.bullets.splice(j, 1);
                score += 10;

                // Drop power-up if on level 1, 3, 5, 7, or 9 and max upgrades not reached
                if ([1, 3, 5, 7, 9].includes(level) && upgradeCount < 5 && !powerUpDroppedThisLevel) {
                    if (Math.random() < 0.3) {  // 30% chance to drop a power-up
                        spawnPowerUp(enemy.x, enemy.y);
                        powerUpDroppedThisLevel = true;  // Mark that a power-up has been dropped
                    }
                }
                break;
            }
        }
    }
}

function checkCollisions() {
    // Enemy collision detection
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Check collision between player and enemy
        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            enemies.splice(i, 1);  // Remove the enemy on collision with player
            
            // If player has shields, reduce the shield count; otherwise, reduce health
            if (player.shieldCount > 0) {
                player.shieldCount--;
            } else {
                playerHealth -= 20;
                if (playerHealth <= 0) {
                    gameOver();
                    return;
                }
            }
        }

        // Bullet collision detection with enemies
        for (let j = player.bullets.length - 1; j >= 0; j--) {
            const bullet = player.bullets[j];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Reduce enemy health by 1 if hit
                enemy.health -= 1;

                // Remove the bullet on impact
                player.bullets.splice(j, 1);

                // If enemy health is 0 or below, remove the enemy and increase score
                if (enemy.health <= 0) {
                    enemies.splice(i, 1);
                    score += 10;

                    // Drop power-up if on level 1, 3, 5, 7, or 9 and max upgrades not reached
                    if ([1, 3, 5, 7, 9].includes(level) && upgradeCount < 5 && !powerUpDroppedThisLevel) {
                        if (Math.random() < 0.3) {  // 30% chance to drop a power-up
                            spawnPowerUp(enemy.x, enemy.y);
                            powerUpDroppedThisLevel = true;  // Mark that a power-up has been dropped
                        }
                    }
                }
                break;  // Stop checking bullets after a hit
            }
        }
    }

    // Power-up collision detection
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];

        // Check collision between player and power-up
        if (
            powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y
        ) {
            // Remove the power-up upon collection
            powerUps.splice(i, 1);

            // Increase upgrade count (up to a max of 5) and apply the next shooting upgrade
            if (upgradeCount < 5) {
                upgradeCount++;
                applyShootingUpgrade();
            }
        }
    }
}


function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const healthRatio = playerHealth / 100;
    const barX = 20; // Move the bar a little further to the right

    ctx.fillStyle = 'red';
    ctx.fillRect(barX, 90, barWidth, barHeight);  // Adjusted X-position
    ctx.fillStyle = 'green';
    ctx.fillRect(barX, 90, barWidth * healthRatio, barHeight);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(barX, 90, barWidth, barHeight);
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
    player.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function drawScore() {
    const textX = 20; // Move the text a little further to the right

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, textX, 30);
    ctx.fillText(`Level: ${level}`, textX, 50);
    ctx.fillText(`Shields: ${player.shieldCount}`, textX, 70);
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

function levelUp() {
    level++;
    levelUpMessage = `Level ${level}!`;
    levelUpMessageTimer = 60;

    enemies.forEach(enemy => enemy.speed += 0.5);
    levelScoreThreshold += 50;

    if (level % 2 === 0) {
        bulletSize += 2;
        bulletColor = 'orange';

        player.shieldCount++;
    }

    powerUpDroppedThisLevel = false;  // Reset flag for the new level
}

function gameOver() {
    alert('Game Over! Try again.');
    document.location.reload();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    movePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawPowerUps(); // Add this line to draw power-ups
    drawScore();
    drawHealthBar();

    if (score >= levelScoreThreshold) {
        levelUp();
        levelScoreThreshold += level * 50;
    }

    if (levelUpMessageTimer > 0) {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(levelUpMessage, canvas.width / 2, canvas.height / 2);
        levelUpMessageTimer--;
    }

    requestAnimationFrame(gameLoop);
}
gameLoop();