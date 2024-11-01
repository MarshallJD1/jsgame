// Get the canvas element and set up the 2D drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define the player object with initial properties
const player = {
    x: canvas.width / 2, // Start in the center of the canvas
    y: canvas.height / 2,
    width: 30, // Width of the player rectangle
    height: 30, // Height of the player rectangle
    speed: 5, // Movement speed
    color: 'blue', // Color of the player
};

// Object to track pressed keys
const keys = {};

// Event listener for keydown events
window.addEventListener('keydown', (e) => {
    keys[e.key] = true; // Mark the key as pressed
});

// Event listener for keyup events
window.addEventListener('keyup', (e) => {
    keys[e.key] = false; // Mark the key as released
});

// Update function to move the player
function update() {
    // Check if specific arrow keys are pressed and adjust the player's position accordingly
    if (keys['ArrowUp']) player.y -= player.speed; // Move up
    if (keys['ArrowDown']) player.y += player.speed; // Move down
    if (keys['ArrowLeft']) player.x -= player.speed; // Move left
    if (keys['ArrowRight']) player.x += player.speed; // Move right

    // Keep the player within the bounds of the canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Draw function to render the player on the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas for the next frame
    ctx.fillStyle = player.color; // Set the fill color for the player
    ctx.fillRect(player.x, player.y, player.width, player.height); // Draw the player rectangle
}

// Main game loop function
function gameLoop() {
    update(); // Update the player's position
    draw(); // Render the player
    requestAnimationFrame(gameLoop); // Call gameLoop again for the next frame
}

// Start the game loop
gameLoop();
