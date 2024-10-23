var board;
const player = 'X';
const ai = 'O';
let currentDifficulty = '';
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
let moveHistory = [];

initializeGameWithRandomDifficulty();

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
    moveHistory = [];

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

function initializeGameWithRandomDifficulty() {
    const randomIndex = Math.floor(Math.random() * difficulties.length);
    currentDifficulty = difficulties[randomIndex];
    document.getElementById('difficulty').innerText = `Difficulty: ${currentDifficulty}`;
    initializeGame();
}

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
    moveHistory.push({ player: currentPlayer, position: squareId });
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

    if (isAiVsAiMode) {
        document.querySelector('.finish').style.display = "block";
        document.querySelector('.finish .message').innerText = gameWon.player === player ? "AI 1 (X) wins!" : "AI 2 (O) wins!";
    } else {
        document.querySelector('.finish').style.display = "block";
        document.querySelector('.finish .message').innerText = gameWon.player === player ? "You win!" : "You lose!";
    }

    cells.forEach(cell => cell.removeEventListener('click', turnClick));
    setTimeout(() => {
        logGameState(() => {
            if (isAiVsAiMode) {
                initializeGame();
                aiTurnLoop();
            } else {
                initializeGameWithRandomDifficulty();
            }
        });
    }, 3000);
}

function declareWinner(result) {
    document.querySelector('.finish').style.display = "block";
    document.querySelector('.finish .message').innerText = result;
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

function bestSpot(difficulty) {
    if (isAiVsAiMode && difficulty === "Optimal" && Math.random() < 0.25) {
        return suboptimalMove();
    }

    switch (difficulty) {
        case "Offensive": return offensiveMove();
        case "Defensive": return defensiveMove();
        case "Optimal": return optimalMove();
        default: return randomMove();
    }
}

function randomMove() {
    let availableSpots = emptySquares();
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
}

function suboptimalMove() {
    let availableSpots = emptySquares();
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
}

function defensiveMove() {
    let move = findCriticalMove(ai);
    return move !== null ? move : findCriticalMove(player) || randomMove();
}

function offensiveMove() {
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

function optimalMove() {
    let bestScore = -Infinity;
    let bestMove;
    board.forEach((spot, idx) => {
        if (typeof spot === 'number') {
            board[idx] = ai;
            let score = minimax(board, 0, false);
            board[idx] = spot;
            if (score > bestScore) {
                bestScore = score;
                bestMove = idx;
            }
        }
    });
    return bestMove;
}

function minimax(newBoard, depth, isMaximizing) {
    let result = checkWinner(newBoard);
    if (result !== null) return result === ai ? 10 : result === player ? -10 : 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        newBoard.forEach((spot, idx) => {
            if (typeof spot === 'number') {
                newBoard[idx] = ai;
                let score = minimax(newBoard, depth + 1, false);
                newBoard[idx] = spot;
                bestScore = Math.max(score, bestScore);
            }
        });
        return bestScore;
    } else {
        let bestScore = Infinity;
        newBoard.forEach((spot, idx) => {
            if (typeof spot === 'number') {
                newBoard[idx] = player;
                let score = minimax(newBoard, depth + 1, true);
                newBoard[idx] = spot;
                bestScore = Math.min(score, bestScore);
            }
        });
        return bestScore;
    }
}

function checkWinner(board) {
    let winner = null;
    winCombos.forEach((combo) => {
        if (combo.every(i => board[i] === ai)) {
            winner = ai;
        } else if (combo.every(i => board[i] === player)) {
            winner = player;
        }
    });
    if (winner) return winner;
    return board.every(spot => typeof spot !== 'number') ? 'tie' : null;
}

function logGameState(callback) {
    let logData = `Difficulty: ${ai1Difficulty && ai2Difficulty ? `${ai1Difficulty} vs ${ai2Difficulty}` : currentDifficulty}\n\nMoves:\n`;
    moveHistory.forEach((move) => {
        logData += `${move.player} at position ${move.position}\n`;
    });
    const gameWon = checkWin(board, player) || checkWin(board, ai);
    if (gameWon) {
        const winner = gameWon.player === player ? "X" : "O";
        logData += `\nWinner: ${winner}\nWinning combination: ${winCombos[gameWon.index].join(", ")}\n`;
    } else if (checkTie()) {
        logData += `\nResult: Tie Game\n`;
    }
    fetch('http://127.0.0.1:5000/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ log: logData })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Game logged successfully:', data.message);
        callback();
    })
    .catch(error => {
        console.error('Error logging game state:', error);
        callback();
    });
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
            }
            return;
        }
        const difficulty = currentPlayer === player ? ai1Difficulty : ai2Difficulty;
        if (typeof board[bestSpot(difficulty)] === 'number') {
            turn(bestSpot(difficulty), currentPlayer);
        }
        currentPlayer = currentPlayer === player ? ai : player;
        turnCounter++;
    }, 1000);
}