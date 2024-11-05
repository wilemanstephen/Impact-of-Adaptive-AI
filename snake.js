var blockSize = 20;
var rows = 30;
var cols = 40;
var board;
var context;

var snakeX = blockSize * 5;
var snakeY = blockSize * 5;
var velocityX = 0;
var velocityY = 0;

var snakeBody = [];
var foodItems = [];
var obstacles = [];
var aiSnakes = [];
var aiRespawnTimers = [];

var score = 0;
var gameOver = false;
var isDefensiveMode = false;
var isOffensiveMode = false;
var snakeSpeed = 4;
var isOptimalMode = false;
var aiSnakeSpeed = 1.2;
var aiSnakeInterval = 100;

window.onload = function() {
    board = document.getElementById("board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d");

    placeFood();
    document.addEventListener("keydown", changeDirection);

    setInterval(update, 1000 / (snakeSpeed * 3));
    setInterval(updateAISnakes, 1000 / (aiSnakeSpeed * 5));
};

function update() {
    if (gameOver) {
        return;
    }

    context.fillStyle = "#90EE90";
    context.fillRect(0, 0, board.width, board.height);

    context.fillStyle = "red";
    for (let i = 0; i < foodItems.length; i++) {
        context.beginPath();
        context.arc(foodItems[i][0] + blockSize / 2, foodItems[i][1] + blockSize / 2, blockSize / 2, 0, 2 * Math.PI);
        context.fill();
    }

    if (score >= 847 && !isDefensiveMode) {
        activateDefensiveMode();
    }

    if (score >= 1694 && !isOffensiveMode) {
    activateOffensiveMode();
}

if (score >= 2541 && !isOptimalMode) {
    activateOptimalMode();
}

    for (let i = 0; i < foodItems.length; i++) {
        if (Math.abs(snakeX - foodItems[i][0]) < blockSize && Math.abs(snakeY - foodItems[i][1]) < blockSize) {
            snakeBody.push([foodItems[i][0], foodItems[i][1]]);
            foodItems.splice(i, 1);
            placeFood();
            increaseScore(121);
            break;
        }
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    if (snakeBody.length) {
        snakeBody[0] = [snakeX, snakeY];
    }

    snakeX += velocityX * blockSize;
    snakeY += velocityY * blockSize;

    for (let i = 0; i < snakeBody.length; i++) {
        if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            gameOver = true;
            alert("Game Over! You hit your own tail.");
        }
    }

    if (isOffensiveMode) {
        for (let j = 0; j < aiSnakes.length; j++) {
            for (let i = 0; i < aiSnakes[j].body.length; i++) {
                if (Math.abs(snakeX - aiSnakes[j].body[i][0]) < blockSize && Math.abs(snakeY - aiSnakes[j].body[i][1]) < blockSize) {
                    respawnAISnake(aiSnakes[j], j);
                    alert("Game Over! You hit the AI snake's body.");
                    alert("Game Over! You hit the AI snake's body.");
                }
            }

            if (Math.abs(aiSnakes[j].x - snakeX) < blockSize * 2 && Math.abs(aiSnakes[j].y - snakeY) < blockSize * 2) {
                avoidPlayerCollision(aiSnakes[j]);
            }
        }
    }

    drawSnake("#4169E1", snakeBody, snakeX, snakeY);

    if (isOffensiveMode) {
        drawAISnakes();
    }

    if (snakeX < 0 || snakeX >= cols * blockSize || snakeY < 0 || snakeY >= rows * blockSize) {
        gameOver = true;
        alert("Game Over! You hit a wall.");
    }

    if (isDefensiveMode) {
        for (let i = 0; i < obstacles.length; i++) {
            if (Math.abs(snakeX - obstacles[i][0]) < blockSize && Math.abs(snakeY - obstacles[i][1]) < blockSize) {
                gameOver = true;
                alert("Game Over! You hit an obstacle.");
            }
        }
        drawObstacles();
    }
}

function updateAISnakes() {
    if (isOffensiveMode) {
        for (let i = 0; i < aiSnakes.length; i++) {
            if (!aiRespawnTimers[i]) {
                moveAISnakeTowardsFood(aiSnakes[i], i);
                // Check collision with player's body
                for (let j = 0; j < snakeBody.length; j++) {
                    if (Math.abs(aiSnakes[i].x - snakeBody[j][0]) < blockSize && Math.abs(aiSnakes[i].y - snakeBody[j][1]) < blockSize) {
                        respawnAISnake(aiSnakes[i], i);
                    }
                }
            }
        }
    }
}

function drawAISnakes() {
    for (let i = 0; i < aiSnakes.length; i++) {
        drawSnake("#FFA500", aiSnakes[i].body, aiSnakes[i].x, aiSnakes[i].y); // Draw AI snake with constant orange color
    }
}

function increaseScore(points) {
    score += points;
    document.getElementById("score").innerText = score;
    if (score >= 3630) {
        gameOver = true;
        alert("You win! Final score: " + score + "Close deaths: " + closeDeathsCall);
    }
}

function activateDefensiveMode() {
    isDefensiveMode = true;
    alert("You've reached Defensive difficulty! Watch out for obstacles!");

    clearInterval(update);
    snakeSpeed = 5;
    setInterval(update, 1000 / snakeSpeed);

    for (let i = 0; i < 7; i++) {
        placeObstacle();
    }
}

function activateOffensiveMode() {
    isOffensiveMode = true;
    alert("Offensive Mode activated! Compete with the AI snakes!");

    obstacles = [];
    clearInterval(update);
    snakeSpeed = 4.5;
    setInterval(update, 1000 / snakeSpeed);

    for (let i = 0; i < 2; i++) {
        aiSnakes.push(createAISnake());
        aiRespawnTimers.push(false);
    }
    while (foodItems.length < 3) {
        placeFood();
    }
}
    while (foodItems.length < 3) {
        placeFood();
    }

function createAISnake() {
    var aiSnake = {
        x: Math.floor(Math.random() * cols) * blockSize,
        y: Math.floor(Math.random() * rows) * blockSize,
        velocityX: 0,
        velocityY: 0,
        speed: aiSnakeSpeed,
        body: []
    };
    aiSnake.body.push([aiSnake.x, aiSnake.y]);
    return aiSnake;
}

function moveAISnakeTowardsFood(aiSnake, index) {
    for (let i = aiSnake.body.length - 1; i > 0; i--) {
        aiSnake.body[i] = aiSnake.body[i - 1];
    }

    aiSnake.body[0] = [aiSnake.x, aiSnake.y];

    // Randomly choose one of the available food items to target
    if (!aiSnake.targetFood || !foodItems.includes(aiSnake.targetFood)) {
        aiSnake.targetFood = foodItems[Math.floor(Math.random() * foodItems.length)];
    }
    let targetFood = aiSnake.targetFood;

    // Move towards the chosen food
    if (Math.abs(aiSnake.x - targetFood[0]) > Math.abs(aiSnake.y - targetFood[1])) {
        if (aiSnake.x < targetFood[0]) {
            aiSnake.velocityX = blockSize;
            aiSnake.velocityY = 0;
        } else if (aiSnake.x > targetFood[0]) {
            aiSnake.velocityX = -blockSize;
            aiSnake.velocityY = 0;
        }
    } else {
        if (aiSnake.y < targetFood[1]) {
            aiSnake.velocityY = blockSize;
            aiSnake.velocityX = 0;
        } else if (aiSnake.y > targetFood[1]) {
            aiSnake.velocityY = -blockSize;
            aiSnake.velocityX = 0;
        }
    }

    aiSnake.x += aiSnake.velocityX;
    aiSnake.y += aiSnake.velocityY;

    if (aiSnake.x < 0) {
        aiSnake.x = 0;
    } else if (aiSnake.x >= cols * blockSize) {
        aiSnake.x = (cols - 1) * blockSize;
    }
    if (aiSnake.y < 0) {
        aiSnake.y = 0;
    } else if (aiSnake.y >= rows * blockSize) {
        aiSnake.y = (rows - 1) * blockSize;
    }

    for (let i = 0; i < foodItems.length; i++) {
        if (aiSnake.x === foodItems[i][0] && aiSnake.y === foodItems[i][1]) {
            aiSnake.body.push([foodItems[i][0], foodItems[i][1]]);
            foodItems.splice(i, 1);
            placeFood();
            break;
        }
    }
}

function avoidPlayerCollision(aiSnake) {
    if (aiSnake.velocityX !== 0) {
        aiSnake.velocityX = 0;
        aiSnake.velocityY = (Math.random() < 0.5 ? -1 : 1) * blockSize;
    } else if (aiSnake.velocityY !== 0) {
        aiSnake.velocityY = 0;
        aiSnake.velocityX = (Math.random() < 0.5 ? -1 : 1) * blockSize;
    }
    aiSnake.x += aiSnake.velocityX;
    aiSnake.y += aiSnake.velocityY;
}

function activateOptimalMode() {
    isOptimalMode = true;
    alert("Optimal Mode activated! Face the ultimate challenge!");

    obstacles = [];
    for (let i = 0; i < 10; i++) {
        placeObstacle();
    }
    clearInterval(update);
    snakeSpeed = 6;
    setInterval(update, 1000 / snakeSpeed);

    aiSnakes = [createAISnake()];
    aiSnakes[0].speed = 2;
    aiRespawnTimers = [false];
} if (aiSnake.velocityY !== 0) {
        aiSnake.velocityY = 0;
        aiSnake.velocityX = (Math.random() < 0.5 ? -1 : 1) * blockSize;
    }
    aiSnake.x += aiSnake.velocityX;
    aiSnake.y += aiSnake.velocityY;

function respawnAISnake(aiSnake, index) {
    let safeDistance = 10 * blockSize;
    let newX, newY;
    do {
        newX = Math.floor(Math.random() * cols) * blockSize;
        newY = Math.floor(Math.random() * rows) * blockSize;
    } while (Math.abs(newX - snakeX) < safeDistance || Math.abs(newY - snakeY) < safeDistance);
    aiSnake.x = newX;
    aiSnake.y = newY;
    aiSnake.body = [[newX, newY]];
    aiSnake.targetFood = null;
} if (aiSnake.velocityY !== 0) {
        aiSnake.velocityY = 0;
        aiSnake.velocityX = (Math.random() < 0.5 ? -1 : 1) * blockSize;
    }

    aiSnake.x += aiSnake.velocityX;
    aiSnake.y += aiSnake.velocityY;

function placeObstacle() {
    var obstacleX, obstacleY;
    var safeDistance = 2;

    do {
        obstacleX = Math.floor(Math.random() * cols) * blockSize;
        obstacleY = Math.floor(Math.random() * rows) * blockSize;
    } while (isObstacleOnSnake(obstacleX, obstacleY) || isNearSnakeHead(obstacleX, obstacleY));

    obstacles.push([obstacleX, obstacleY]);
}

function isObstacleOnSnake(x, y) {
    for (let i = 0; i < snakeBody.length; i++) {
        if (x == snakeBody[i][0] && y == snakeBody[i][1]) {
            return true;
        }
    }
    return false;
}

function isNearSnakeHead(x, y) {
    return Math.abs(x - snakeX) <= blockSize * 2 && Math.abs(y - snakeY) <= blockSize * 2;
}

function drawObstacles() {
    context.fillStyle = "brown";
    for (let i = 0; i < obstacles.length; i++) {
        context.beginPath();
        context.arc(obstacles[i][0] + blockSize / 2, obstacles[i][1] + blockSize / 2, blockSize / 2, 0, 2 * Math.PI);
        context.fill();
    }
}

function drawSnake(color, body, headX, headY) {
    context.fillStyle = color;
    for (let i = 0; i < body.length; i++) {
        context.beginPath();
        context.arc(body[i][0] + blockSize / 2, body[i][1] + blockSize / 2, blockSize / 2, 0, 2 * Math.PI);
        context.fill();
    }
    
    context.fillStyle = color;
    context.beginPath();
    context.arc(headX + blockSize / 2, headY + blockSize / 2, blockSize / 2, 0, 2 * Math.PI);
    context.fill();
    
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    let smileOffsetX = 0;
    let smileOffsetY = 0;
    if (velocityX === 0.5) {
        eyeOffsetX = blockSize / 4;
        smileOffsetX = blockSize / 3;
    } else if (velocityX === -0.5) {
        eyeOffsetX = -blockSize / 4;
        smileOffsetX = -blockSize / 3;
    } else if (velocityY === 0.5) {
        eyeOffsetY = blockSize / 4;
        smileOffsetY = blockSize / 3;
    } else if (velocityY === -0.5) {
        eyeOffsetY = -blockSize / 4;
        smileOffsetY = -blockSize / 3;
    }

    context.fillStyle = "white";
    context.fillRect(headX + blockSize / 4 + eyeOffsetX, headY + blockSize / 4 + eyeOffsetY, blockSize / 5, blockSize / 5);
    context.fillRect(headX + (3 * blockSize) / 4 + eyeOffsetX - blockSize / 5, headY + blockSize / 4 + eyeOffsetY, blockSize / 5, blockSize / 5);
    
    context.fillStyle = "black";
    context.fillRect(headX + blockSize / 4 + eyeOffsetX + blockSize / 10, headY + blockSize / 4 + eyeOffsetY + blockSize / 10, blockSize / 10, blockSize / 10);
    context.fillRect(headX + (3 * blockSize) / 4 + eyeOffsetX - blockSize / 5 + blockSize / 10, headY + blockSize / 4 + eyeOffsetY + blockSize / 10, blockSize / 10, blockSize / 10);
    
    context.strokeStyle = "black";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(headX + blockSize / 2 + smileOffsetX, headY + (2 * blockSize) / 3 + smileOffsetY, blockSize / 6, 0, Math.PI, false);
    context.stroke();
}

function changeDirection(e) {
    var key = e.code.toLowerCase();
    if ((key === "arrowup" || key === "keyw") && velocityY != 1) {
        velocityX = 0;
        velocityY = -0.5;
    }
    if ((key === "arrowdown" || key === "keys") && velocityY != -1) {
        velocityX = 0;
        velocityY = 0.5;
    }
    if ((key === "arrowleft" || key === "keya") && velocityX != 1) {
        velocityX = -0.5;
        velocityY = 0;
    }
    if ((key === "arrowright" || key === "keyd") && velocityX != -1) {
        velocityX = 0.5;
        velocityY = 0;
    }
}

function placeFood() {
    var foodX, foodY;
    do {
        foodX = Math.floor(Math.random() * (cols - 2) + 1) * blockSize;
        foodY = Math.floor(Math.random() * (rows - 2) + 1) * blockSize;
    } while (isFoodOnSnake(foodX, foodY));
    foodItems.push([foodX, foodY]);
}

function isFoodOnSnake(x, y) {
    for (let i = 0; i < snakeBody.length; i++) {
        if (x == snakeBody[i][0] && y == snakeBody[i][1]) {
            return true;
        }
    }
    return false;
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (radius === undefined) {
        radius = 5;
    }
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
};