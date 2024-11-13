var board;
const player = 'X';
const ai = 'O';
let currentDifficulty = 'Easy';
let playerScore = 0;
let ai1Difficulty = '';
let ai2Difficulty = '';
let isAiVsAiMode = false;
const difficulties = ["Easy", "Defensive", "Offensive", "Optimal"];
const winCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];
const cells = document.querySelectorAll('.cell');

initializeGameWithAdaptiveDifficulty();

document.getElementById("aiVsAiBtn").addEventListener('click', function() {
    isAiVsAiMode = true;
    showAi1Modal();
});

function showAi1Modal() {
    document.getElementById("ai1DifficultyModal").style.display = "flex";
}

function submitAi1Difficulty() {
    const selectedAi1 = document.querySelector('input[name="ai1Difficulty"]:checked');
    if (selectedAi1) {
        ai1Difficulty = selectedAi1.value;
        document.getElementById("ai1DifficultyModal").style.display = "none";
        document.getElementById("ai2DifficultyModal").style.display = "flex";
    } else {
        alert("Please select a difficulty for AI 1.");
    }
}

function submitAi2Difficulty() {
    const selectedAi2 = document.querySelector('input[name="ai2Difficulty"]:checked');
    if (selectedAi2) {
        ai2Difficulty = selectedAi2.value;
        document.getElementById("ai2DifficultyModal").style.display = "none";
        initializeGame();
        aiTurnLoop();
    } else {
        alert("Please select a difficulty for AI 2.");
    }
}

function initializeGame() {
    board = Array.from(Array(9).keys());

    if (isAiVsAiMode) {
        document.getElementById('difficulty').innerText = `AI 1 (X): ${ai1Difficulty}  |  AI 2 (O): ${ai2Difficulty}`;
    } else {
        document.getElementById('difficulty').innerText = `Difficulty: ${currentDifficulty}`;
    }

    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = '';
        cells[i].style.removeProperty('background-color');
        cells[i].className = 'cell';
        cells[i].removeEventListener('click', turnClick);
        if (!isAiVsAiMode) {
            cells[i].addEventListener('click', turnClick, false);
        }
    }
    document.querySelector('.finish').style.display = "none";
    clearHighlight();
}

function initializeGameWithAdaptiveDifficulty() {
    updateDifficultyBasedOnScore();
    document.getElementById('difficulty').innerText = `Difficulty: ${currentDifficulty}`;
    initializeGame();
}

function updateDifficultyBasedOnScore() {
    if (playerScore >= 6) {
        currentDifficulty = 'Optimal';
    } else if (playerScore >= 4) {
        currentDifficulty = 'Offensive';
    } else if (playerScore >= 2) {
        currentDifficulty = 'Defensive';
    } else {
        currentDifficulty = 'Easy';
    }
}
    initializeGame();

function turnClick(square) {
    if (!isAiVsAiMode && typeof board[square.target.id] === 'number') {
        turn(square.target.id, player);
        if (!checkWin(board, player) && !checkTie()) {
            turn(bestSpot(currentDifficulty), ai);
        }
    }
}

function turn(squareId, currentPlayer) {
    board[squareId] = currentPlayer;
    document.getElementById(squareId).innerText = currentPlayer;
    document.getElementById(squareId).classList.add(currentPlayer === 'X' ? 'X' : 'O');
    let gameWon = checkWin(board, currentPlayer);
    if (gameWon) {
        gameOver(gameWon);
    } else if (checkTie()) {
        declareWinner("It's a tie!");
        highlightTie();
    }
}

function checkWin(board, player) {
    let plays = board.reduce((a, e, i) => (e === player) ? a.concat(i) : a, []);
    let gameWon = null;
    for (let [index, win] of winCombos.entries()) {
        if (win.every(elem => plays.includes(elem))) {
            gameWon = { index: index, player: player };
            break;
        }
    }
    return gameWon;
}

function checkTie() {
    if (emptySquares().length === 0 && !checkWin(board, player) && !checkWin(board, ai)) {
        return true;
    }
    return false;
}

function gameOver(gameWon) {
    for (let index of winCombos[gameWon.index]) {
        document.getElementById(index).classList.add('win-highlight');
    }

    document.querySelector('.finish').style.display = "block";
    document.querySelector('.finish .message').innerText = isAiVsAiMode ? (gameWon.player === player ? "AI 1 (X) wins!" : "AI 2 (O) wins!") : (gameWon.player === player ? "You win!" : "You lose!");
    updateScore(gameWon.player);

    cells.forEach(cell => cell.removeEventListener('click', turnClick));
    setTimeout(() => {
        initializeGameWithAdaptiveDifficulty();
    }, 2000);
}

function declareWinner(result) {
    document.querySelector('.finish').style.display = "block";
    document.querySelector('.finish .message').innerText = result;
    setTimeout(() => {
        initializeGameWithAdaptiveDifficulty();
    }, 2000);
}

function highlightTie() {
    cells.forEach(cell => {
        if (!cell.classList.contains('win-highlight')) {
            cell.classList.add('tie-highlight');
        }
    });
}

function emptySquares() {
    return board.filter(s => typeof s === 'number');
}

function bestSpot(difficulty, isAi2 = false) {
    if (isAiVsAiMode && difficulty === "Optimal") {
        return isAi2 ? adaptiveStrategy2() : adaptiveStrategy1();
    }

    switch (difficulty) {
        case "Offensive": return offensiveMove(isAi2);
        case "Defensive": return defensiveMove(isAi2);
        case "Optimal": return isAi2 ? adaptiveStrategy2() : adaptiveStrategy1();
        default: return randomMove();
    }
}

function randomMove() {
    let availableSpots = emptySquares();
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
}

function defensiveMove(isAi2) {
    let move = findCriticalMove(ai);
    return move !== null ? move : findCriticalMove(player) || randomMove();
}

function offensiveMove(isAi2) {
    let move = findCriticalMove(ai);
    return move !== null ? move : findCriticalMove(player) || randomMove();
}

function findCriticalMove(player) {
    for (let [index, win] of winCombos.entries()) {
        let winPoss = win.map(i => board[i]);
        let empty = win.filter(i => typeof board[i] === 'number');
        if (winPoss.filter(val => val === player).length === 2 && empty.length === 1) {
            return empty[0];
        }
    }
    return null;
}

function adaptiveStrategy1() {
    let moves = ["Easy", "Defensive", "Offensive"];
    return chooseBasedOnGameState(moves);
}

function adaptiveStrategy2() {
    let moves = ["Offensive", "Defensive", "Easy"];
    return chooseBasedOnGameState(moves);
}

function chooseBasedOnGameState(moves) {
    let bestMove;
    for (let move of moves) {
        switch (move) {
            case "Easy":
                bestMove = randomMove();
                break;
            case "Defensive":
                bestMove = defensiveMove();
                if (bestMove !== null) return bestMove;
                break;
            case "Offensive":
                bestMove = offensiveMove();
                if (bestMove !== null) return bestMove;
                break;
        }
    }
    return bestMove;
}

function updateScore(gameWinner) {
    if (gameWinner === player) {
        playerScore += 1;
    } else if (gameWinner === ai) {
        playerScore -= 1;
    }
}

function clearHighlight() {
    cells.forEach(cell => {
        cell.classList.remove('win-highlight', 'tie-highlight');
    });
}

function aiTurnLoop() {
    let currentPlayer = player;
    let turnCounter = 0;
    const aiInterval = setInterval(() => {
        if (turnCounter >= 9 || checkWin(board, player) || checkWin(board, ai) || checkTie()) {
            clearInterval(aiInterval);
            if (checkTie()) {
                declareWinner("It's a tie between AI 1 and AI 2!");
                highlightTie();
                setTimeout(() => {
                    initializeGame();
                    aiTurnLoop();
                }, 3000);
            } else {
                setTimeout(() => {
                    initializeGame();
                    aiTurnLoop();
                }, 3000);
            }
            return;
        }
        const difficulty = currentPlayer === player ? ai1Difficulty : ai2Difficulty;
        const isAi2 = currentPlayer === ai;
        if (typeof board[bestSpot(difficulty, isAi2)] === 'number') {
            turn(bestSpot(difficulty, isAi2), currentPlayer);
        }
        currentPlayer = currentPlayer === player ? ai : player;
        turnCounter++;
    }, 1000);
}