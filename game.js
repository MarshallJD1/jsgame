const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

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

    const bullet = {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        width: bulletSize,
        height: bulletSize,
        vx: bulletSpeed * Math.cos(angle),
        vy: bulletSpeed * Math.sin(angle),
        color: bulletColor
    };

    player.bullets.push(bullet);
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
    });
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

        if (enemy.x + enemy.width < 0) {
            enemies.splice(i, 1);
            playerHealth -= 20;
            if (playerHealth <= 0) gameOver();
        }
    }
}

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        for (let j = player.bullets.length - 1; j >= 0; j--) {
            const bullet = player.bullets[j];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemies.splice(i, 1);
                player.bullets.splice(j, 1);
                
                score += 10;
                break;
            }
        }

        if (enemy.x + enemy.width < 0) {
            enemies.splice(i, 1);

            if (player.shieldCount > 0) {
                player.shieldCount--;
            } else {
                playerHealth -= 20;
                if (playerHealth <= 0) {
                    gameOver();
                    return;
                }
            }
            continue;
        }

        if (
            enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y
        ) {
            enemies.splice(i, 1);

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
}

function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const healthRatio = playerHealth / 100;
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 90, barWidth, barHeight);  // Adjusted Y-position
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 90, barWidth * healthRatio, barHeight);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 90, barWidth, barHeight);
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
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 50);
    ctx.fillText(`Shields: ${player.shieldCount}`, 10, 70);
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
