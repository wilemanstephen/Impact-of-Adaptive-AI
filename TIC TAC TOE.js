var board;
const player = 'X';
const ai = 'O';
let currentDifficulty = '';
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

function initializeGame() {
    board = Array.from(Array(9).keys());
    moveHistory = []; 
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = '';
        cells[i].style.removeProperty('background-color');
        cells[i].className = 'cell';
        cells[i].addEventListener('click', turnClick, false);
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
    if (typeof board[square.target.id] === 'number') {
        turn(square.target.id, player);
        if (!checkWin(board, player) && !checkTie()) {
            turn(bestSpot(), ai);
        }
    }
}

function turn(squareId, player) {
    board[squareId] = player;
    moveHistory.push({ player: player, position: squareId });
    document.getElementById(squareId).innerText = player;
    document.getElementById(squareId).classList.add(player === 'X' ? 'X' : 'O');
    let gameWon = checkWin(board, player);
    if (gameWon) gameOver(gameWon);
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

function gameOver(gameWon) {
    for (let index of winCombos[gameWon.index]) {
        document.getElementById(index).classList.add('win-highlight');
    }
    document.querySelector('.finish').style.display = "block";
    document.querySelector('.finish .message').innerText = gameWon.player === player ? "You win!" : "You lose.";
    cells.forEach(cell => cell.removeEventListener('click', turnClick));
    setTimeout(() => {
        logGameState(() => initializeGameWithRandomDifficulty());
    }, 2000);
}

function checkTie() {
    if (emptySquares().length === 0) {
        cells.forEach(cell => cell.classList.add('tie'));
        declareWinner("Tie Game!");
        setTimeout(() => {
            logGameState(() => initializeGameWithRandomDifficulty());
        }, 2000);
        return true;
    }
    return false;
}

function emptySquares() {
    return board.filter(s => typeof s === 'number');
}

function bestSpot() {
    if (currentDifficulty === "Offensive") {
        return offensiveMove();
    } else if (currentDifficulty === "Defensive") {
        return defensiveMove();
    } else if (currentDifficulty === "Optimal") {
        return optimalMove();
    } else {
        return randomMove();
    }
}

function randomMove() {
    let availableSpots = emptySquares();
    return availableSpots[Math.floor(Math.random() * availableSpots.length)];
}

function defensiveMove() {
    let move = findCriticalMove(player);
    return move !== null ? move : randomMove();
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
    let logData = `Difficulty: ${currentDifficulty}\n\nMoves:\n`;

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
        cell.classList.remove('win-highlight', 'tie');
    });
}

function declareWinner(result) {
    document.querySelector('.finish .message').innerText = result;
    document.querySelector('.finish').style.display = "block";
}