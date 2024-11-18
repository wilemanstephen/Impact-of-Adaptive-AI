var blockSize = 20;
var rows = 20;
var cols = 20;
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

var score = 0;
var gameOver = false;
var isDefensiveMode = false;
var isOffensiveMode = false;
var snakeSpeed = 8;
var isOptimalMode = false;
var aiSnakeSpeed = 1;
var aiSnakeInterval = 200;
var aiUpdateInterval;

window.onload = function() {
    board = document.getElementById("board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d");

    placeFood();
    document.addEventListener("keydown", changeDirection);

    setInterval(update, 1000 / snakeSpeed);
    aiUpdateInterval = setInterval(updateAISnakes, 1500 / aiSnakeSpeed);
};

function update() {
    if (gameOver) {
        clearInterval(aiUpdateInterval);
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

    drawObstacles();

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
            return;
        }
    }

    if (snakeX < 0 || snakeX >= cols * blockSize || snakeY < 0 || snakeY >= rows * blockSize) {
        gameOver = true;
        alert("Game Over! You hit a wall.");
        return;
    }

    for (let i = 0; i < obstacles.length; i++) {
        if (Math.abs(snakeX - obstacles[i][0]) < blockSize && Math.abs(snakeY - obstacles[i][1]) < blockSize) {
            gameOver = true;
            alert("Game Over! You hit an obstacle.");
            return;
        }
    }

    for (let i = 0; i < aiSnakes.length; i++) {
        for (let j = 0; j < aiSnakes[i].body.length; j++) {
            if (Math.abs(snakeX - aiSnakes[i].body[j][0]) < blockSize && Math.abs(snakeY - aiSnakes[i].body[j][1]) < blockSize) {
                gameOver = true;
                alert("Game Over! You collided with an AI snake.");
                return;
            }
        }
    }

    drawSnake("#4169E1", snakeBody, snakeX, snakeY);

    updateAISnakes();

    for (let i = 0; i < foodItems.length; i++) {
        if (Math.abs(snakeX - foodItems[i][0]) < blockSize && Math.abs(snakeY - foodItems[i][1]) < blockSize) {
            snakeBody.push([foodItems[i][0], foodItems[i][1]]);
            foodItems.splice(i, 1);
            placeFood();
            increaseScore();
            break;
        }
    }

    if (score >= 5 && !isDefensiveMode) {
        activateDefensiveMode();
    }
    if (score >= 10 && !isOffensiveMode) {
        activateOffensiveMode();
    }
    if (score >= 15 && !isOptimalMode) {
        activateOptimalMode();
    }
}

function increaseScore() {
    score += 1;
    document.getElementById("score").innerText = score;
} 
    document.getElementById("score").innerText = score;

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
    var foodX, foodY;
    do {
        foodX = Math.floor(Math.random() * (cols - 6) + 3) * blockSize;
        foodY = Math.floor(Math.random() * (rows - 6) + 3) * blockSize;
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

function drawSnake(color, body, headX, headY) {
    context.fillStyle = color;
    for (let i = 0; i < body.length; i++) {
        context.beginPath();
        context.arc(body[i][0] + blockSize / 2, body[i][1] + blockSize / 2, blockSize / 2 - 2, 0, 2 * Math.PI);
        context.fill();
    }
    context.beginPath();
    context.arc(headX + blockSize / 2, headY + blockSize / 2, blockSize / 2 - 2, 0, 2 * Math.PI);
    context.fill();

    context.fillStyle = "white";
    context.beginPath();
    context.arc(headX + blockSize / 3, headY + blockSize / 3, blockSize / 10, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.arc(headX + (2 * blockSize) / 3, headY + blockSize / 3, blockSize / 10, 0, 2 * Math.PI);
    context.fill();

    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(headX + blockSize / 2, headY + (2 * blockSize) / 3, blockSize / 6, 0, Math.PI, false);
    context.stroke();
}

function activateDefensiveMode() {
    isDefensiveMode = true;
    alert("Defensive Mode activated! Watch out for obstacles!");
    for (let i = 0; i < 7; i++) {
        placeObstacle();
    }
}

function activateOffensiveMode() {
    isOffensiveMode = true;
    alert("Offensive Mode activated! Compete with the AI snakes!");
    obstacles = [];
    drawObstacles();
    aiSnakes.push(createAISnake());
}

function activateOptimalMode() {
    isOptimalMode = true;
    alert("Optimal Mode activated! Face the ultimate challenge!");
    for (let i = 0; i < 10; i++) {
        placeObstacle();
    }
    aiSnakes.push(createAISnake());
    aiSnakes.push(createAISnake());
}

function placeObstacle() {
    var obstacleX, obstacleY;
    do {
        obstacleX = Math.floor(Math.random() * cols) * blockSize;
        obstacleY = Math.floor(Math.random() * rows) * blockSize;
    } while (isObstacleOnSnake(obstacleX, obstacleY) || isObstacleNearOtherObstacles(obstacleX, obstacleY));
    obstacles.push([obstacleX, obstacleY]);
    drawObstacles();
}

function isObstacleOnSnake(x, y) {
    for (let i = 0; i < snakeBody.length; i++) {
        if (x == snakeBody[i][0] && y == snakeBody[i][1]) {
            return true;
        }
    }
    return false;
}

function isObstacleNearOtherObstacles(x, y) {
    for (let i = 0; i < obstacles.length; i++) {
        if (Math.abs(x - obstacles[i][0]) < blockSize * 2 && Math.abs(y - obstacles[i][1]) < blockSize * 2) {
            return true;
        }
    }
    return false;
}

function drawObstacles() {
    context.fillStyle = "purple";
    for (let i = 0; i < obstacles.length; i++) {
        context.beginPath();
        context.moveTo(obstacles[i][0] + blockSize / 2, obstacles[i][1]);
        context.lineTo(obstacles[i][0], obstacles[i][1] + blockSize);
        context.lineTo(obstacles[i][0] + blockSize, obstacles[i][1] + blockSize);
        context.closePath();
        context.fill();
    }
}

function createAISnake() {
    var aiSnake = {
        x: Math.floor(Math.random() * cols) * blockSize,
        y: Math.floor(Math.random() * rows) * blockSize,
        velocityX: 0,
        velocityY: 0,
        body: []
    };
    aiSnake.body.push([aiSnake.x, aiSnake.y]);
    return aiSnake;
}

function updateAISnakes() {
    if (!isOffensiveMode && !isOptimalMode) {
        return;
    }

    for (let i = 0; i < aiSnakes.length; i++) {
        moveAISnake(aiSnakes[i]);
    }
    drawAISnakes();
}

function moveAISnake(aiSnake) {
    if (foodItems.length > 0) {
        var targetFood = foodItems[Math.floor(Math.random() * foodItems.length)];
        if (aiSnake.x < targetFood[0]) {
            aiSnake.velocityX = 1;
            aiSnake.velocityY = 0;
        } else if (aiSnake.x > targetFood[0]) {
            aiSnake.velocityX = -1;
            aiSnake.velocityY = 0;
        } else if (aiSnake.y < targetFood[1]) {
            aiSnake.velocityX = 0;
            aiSnake.velocityY = 1;
        } else if (aiSnake.y > targetFood[1]) {
            aiSnake.velocityX = 0;
            aiSnake.velocityY = -1;
        }
    }

    aiSnake.x += aiSnake.velocityX * (blockSize / 2);
    aiSnake.y += aiSnake.velocityY * (blockSize / 2);

    aiSnake.body.push([aiSnake.x, aiSnake.y]);
    if (aiSnake.body.length > 3) {
        aiSnake.body.shift();
    }

    for (let i = 0; i < foodItems.length; i++) {
        if (Math.abs(aiSnake.x - foodItems[i][0]) < blockSize && Math.abs(aiSnake.y - foodItems[i][1]) < blockSize) {
            aiSnake.body.push([foodItems[i][0], foodItems[i][1]]);
            foodItems.splice(i, 1);
            placeFood();
            break;
        }
    }

    if (Math.abs(aiSnake.x - snakeX) < blockSize && Math.abs(aiSnake.y - snakeY) < blockSize) {
        gameOver = true;
        alert("Game Over! You hit an AI snake.");
        return;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        if (Math.abs(aiSnake.x - snakeBody[i][0]) < blockSize && Math.abs(aiSnake.y - snakeBody[i][1]) < blockSize) {
            aiSnakes.splice(aiSnakes.indexOf(aiSnake), 1);
            setTimeout(() => {
                let newX, newY;
                do {
                    newX = Math.floor(Math.random() * cols) * blockSize;
                    newY = Math.floor(Math.random() * rows) * blockSize;
                } while (isOnSnake(newX, newY, snakeBody));
                aiSnakes.push(createAISnakeWithPosition(newX, newY));
            }, 3000);
            return;
        }
    }
}

function isOnSnake(x, y, body) {
    for (let i = 0; i < body.length; i++) {
        if (x == body[i][0] && y == body[i][1]) {
            return true;
        }
    }
    return false;
}

function createAISnakeWithPosition(x, y) {
    var aiSnake = {
        x: x,
        y: y,
        velocityX: 0,
        velocityY: 0,
        body: []
    };
    aiSnake.body.push([x, y]);
    return aiSnake;
}

function drawAISnakes() {
    for (let i = 0; i < aiSnakes.length; i++) {
        drawAISnakeSquare(aiSnakes[i]);
    }
}

function drawAISnakeSquare(aiSnake) {
    context.fillStyle = "#FFA500";
    for (let i = 0; i < aiSnake.body.length; i++) {
        context.fillRect(aiSnake.body[i][0], aiSnake.body[i][1], blockSize, blockSize);
    }
    context.fillStyle = "white";
    context.fillRect(aiSnake.x + blockSize / 4, aiSnake.y + blockSize / 4, blockSize / 2, blockSize / 2);
    context.strokeStyle = "black";
    context.strokeRect(aiSnake.x + blockSize / 4, aiSnake.y + blockSize / 4, blockSize / 2, blockSize / 2);
}