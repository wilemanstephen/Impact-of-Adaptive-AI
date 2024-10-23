var blockSize = 25;
var rows = 30;
var cols = 40;
var board;
var context;

var snakeX = blockSize * 5;
var snakeY = blockSize * 5;
var velocityX = 0;
var velocityY = 0;

var snakeBody = [];
var foodX;
var foodY;
var obstacles = [];
var aiSnakes = [];
var aiRespawnTimers = [];

var score = 0;
var gameOver = false;
var isDefensiveMode = false;
var isOffensiveMode = false;
var snakeSpeed = 4.5;
var aiSnakeSpeed = 4;
var aiSnakeInterval = 200;

window.onload = function() {
    board = document.getElementById("board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d");

    placeFood();
    document.addEventListener("keydown", changeDirection);

    setInterval(update, 1000 / snakeSpeed);
    setInterval(updateAISnakes, aiSnakeInterval);
};

function update() {
    if (gameOver) {
        return;
    }

    context.fillStyle = "#90EE90";
    context.fillRect(0, 0, board.width, board.height);

    context.fillStyle = "red";
    context.fillRect(foodX, foodY, blockSize, blockSize);

    if (score >= 847 && !isDefensiveMode) {
        activateDefensiveMode();
    }

    if (score >= 1694 && !isOffensiveMode) {
        activateOffensiveMode();
    }

    if (snakeX == foodX && snakeY == foodY) {
        snakeBody.push([foodX, foodY]);
        placeFood();
        increaseScore(121);
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    if (snakeBody.length) {
        snakeBody[0] = [snakeX, snakeY];
    }

    snakeX += velocityX * blockSize;
    snakeY += velocityY * blockSize;

    for (let i = 1; i < snakeBody.length; i++) {
        if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            gameOver = true;
            alert("Game Over! You hit your own tail.");
        }
    }

    if (isOffensiveMode) {
        for (let j = 0; j < aiSnakes.length; j++) {
            for (let i = 0; i < aiSnakes[j].body.length; i++) {
                if (snakeX === aiSnakes[j].body[i][0] && snakeY === aiSnakes[j].body[i][1]) {
                    gameOver = true;
                    alert("Game Over! You collided with the AI snake.");
                }
            }
        }
    }

    drawCuteSnake();

    if (snakeX < 0 || snakeX >= cols * blockSize || snakeY < 0 || snakeY >= rows * blockSize) {
        gameOver = true;
        alert("Game Over! You hit the wall.");
    }

    if (isDefensiveMode) {
        for (let i = 0; i < obstacles.length; i++) {
            if (snakeX === obstacles[i][0] && snakeY === obstacles[i][1]) {
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
                moveAISnake(aiSnakes[i], i);
            }
            drawAISnake(aiSnakes[i], i);
        }
    }
}

function increaseScore(points) {
    score += points;
    document.getElementById("score").innerText = score;
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
}

function createAISnake() {
    var aiSnake = {
        x: Math.floor(Math.random() * cols) * blockSize,
        y: Math.floor(Math.random() * rows) * blockSize,
        velocityX: 0,
        velocityY: 0,
        speed: aiSnakeSpeed,
        body: [[Math.floor(Math.random() * cols) * blockSize, Math.floor(Math.random() * rows) * blockSize]]
    };

    var directions = [-1, 1];
    aiSnake.velocityX = directions[Math.floor(Math.random() * directions.length)];
    aiSnake.velocityY = directions[Math.floor(Math.random() * directions.length)];

    return aiSnake;
}

function moveAISnake(aiSnake, index) {
    for (let i = aiSnake.body.length - 1; i > 0; i--) {
        aiSnake.body[i] = aiSnake.body[i - 1];
    }

    aiSnake.body[0] = [aiSnake.x, aiSnake.y];

    aiSnake.x += aiSnake.velocityX * blockSize;
    aiSnake.y += aiSnake.velocityY * blockSize;

    if (aiSnake.x < foodX) {
        aiSnake.velocityX = 1;
        aiSnake.velocityY = 0;
    } else if (aiSnake.x > foodX) {
        aiSnake.velocityX = -1;
        aiSnake.velocityY = 0;
    } else if (aiSnake.y < foodY) {
        aiSnake.velocityY = 1;
        aiSnake.velocityX = 0;
    } else if (aiSnake.y > foodY) {
        aiSnake.velocityY = -1;
        aiSnake.velocityX = 0;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        if (aiSnake.x === snakeBody[i][0] && aiSnake.y === snakeBody[i][1]) {
            alert("AI snake collided with the player. It will despawn and reappear in 5 seconds.");
            aiRespawnTimers[index] = true;
            setTimeout(() => {
                aiSnakes[index] = createAISnake();
                aiRespawnTimers[index] = false;
            }, 5000);
        }
    }

    if (aiSnake.x === foodX && aiSnake.y === foodY) {
        aiSnake.body.push([foodX, foodY]);
        placeFood();
    }
}

function drawAISnake(aiSnake, index) {
    if (!aiRespawnTimers[index]) {
        context.fillStyle = "#FFD700";
        for (let i = 0; i < aiSnake.body.length; i++) {
            context.beginPath();
            context.roundRect(aiSnake.body[i][0], aiSnake.body[i][1], blockSize, blockSize, 10);
            context.fill();
        }

        context.fillStyle = "white";
        context.beginPath();
        context.arc(aiSnake.x + blockSize / 4, aiSnake.y + blockSize / 3, 4, 0, 2 * Math.PI);
        context.arc(aiSnake.x + (3 * blockSize) / 4, aiSnake.y + blockSize / 3, 4, 0, 2 * Math.PI);
        context.fill();
        context.fillStyle = "black";
        context.beginPath();
        context.arc(aiSnake.x + blockSize / 4, aiSnake.y + blockSize / 3, 2, 0, 2 * Math.PI);
        context.arc(aiSnake.x + (3 * blockSize) / 4, aiSnake.y + blockSize / 3, 2, 0, 2 * Math.PI);
        context.fill();
        context.fillStyle = "red";
        context.beginPath();
        context.fillRect(aiSnake.x + blockSize / 2 - 2, aiSnake.y + (2 * blockSize) / 3, 4, 5);
    }
}

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
        context.fillRect(obstacles[i][0], obstacles[i][1], blockSize, blockSize);
    }
}

function drawCuteSnake() {
    context.fillStyle = "#4169E1";
    context.beginPath();
    context.roundRect(snakeX, snakeY, blockSize, blockSize, 10);
    context.fill();
    context.fillStyle = "white";
    context.beginPath();
    context.arc(snakeX + blockSize / 4, snakeY + blockSize / 3, 4, 0, 2 * Math.PI);
    context.arc(snakeX + (3 * blockSize) / 4, snakeY + blockSize / 3, 4, 0, 2 * Math.PI);
    context.fill();
    context.fillStyle = "black";
    context.beginPath();
    context.arc(snakeX + blockSize / 4, snakeY + blockSize / 3, 2, 0, 2 * Math.PI);
    context.arc(snakeX + (3 * blockSize) / 4, snakeY + blockSize / 3, 2, 0, 2 * Math.PI);
    context.fill();
    context.fillStyle = "red";
    context.beginPath();
    context.fillRect(snakeX + blockSize / 2 - 2, snakeY + (2 * blockSize) / 3, 4, 5);
    for (let i = 0; i < snakeBody.length; i++) {
        context.fillStyle = "#4169E1";
        context.beginPath();
        context.roundRect(snakeBody[i][0], snakeBody[i][1], blockSize, blockSize, 10);
        context.fill();
    }
}

function changeDirection(e) {
    var key = e.code.toLowerCase();
    if ((key === "arrowup" || key === "keyw") && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
    }
    if ((key === "arrowdown" || key === "keys") && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
    }
    if ((key === "arrowleft" || key === "keya") && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
    }
    if ((key === "arrowright" || key === "keyd") && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
    }
}

function placeFood() {
    do {
        foodX = Math.floor(Math.random() * (cols - 2) + 1) * blockSize;
        foodY = Math.floor(Math.random() * (rows - 2) + 1) * blockSize;
    } while (isFoodOnSnake(foodX, foodY));
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