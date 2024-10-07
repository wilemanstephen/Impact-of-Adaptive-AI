var board;
const player = 'X';
const ai = 'O';
let currentDifficulty = 'Easy';
const difficulties = ["Easy", "Defensive", "Offensive"];
let winCount = 0;
let lossCount = 0;
let tieCount = 0;
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

document.getElementById('reset').addEventListener('click', startGame);
document.getElementById('change-difficulty').addEventListener('click', changeDifficulty);
const cells = document.querySelectorAll('.cell');
startGame();

function startGame() {
    board = Array.from(Array(9).keys());
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = '';
        cells[i].style.removeProperty('background-color');
        cells[i].className = 'cell';
        cells[i].addEventListener('click', turnClick, false);
    }
    document.querySelector('.finish').style.display = "none";
    document.getElementById('difficulty').innerText = `Difficulty: ${currentDifficulty}`;
    updateScores();
    clearHighlight();
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
    if (gameWon) gameOver(gameWon);
    return gameWon;
}

function gameOver(gameWon) {
    for (let index of winCombos[gameWon.index]) {
        document.getElementById(index).classList.add('win-highlight');
    }
    document.querySelector('.finish').style.display = "block";
    document.querySelector('.finish .message').innerText = gameWon.player === player ? "You win!" : "You lose.";
    cells.forEach(cell => cell.removeEventListener('click', turnClick));
    updateScore(gameWon.player === player);
}

function updateScore(isPlayer) {
    if (isPlayer) {
        winCount++;
    } else {
        lossCount++;
    }
    document.getElementById('wins').innerText = winCount;
    document.getElementById('losses').innerText = lossCount;
    document.getElementById('ties').innerText = tieCount;
}

function checkTie() {
    if (emptySquares().length === 0) {
        for (let i = 0; i < cells.length; i++) {
            cells[i].classList.add('tie');
        }
        declareWinner("Tie Game!");
        tieCount++;
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

function changeDifficulty() {
    let currentIndex = difficulties.indexOf(currentDifficulty);
    currentDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
    document.getElementById('difficulty').innerText = `Difficulty: ${currentDifficulty}`;
    startGame();
}

function clearHighlight() {
    cells.forEach(cell => {
        cell.classList.remove('win-highlight', 'tie');
    });
}

function declareWinner(result) {
    document.querySelector('.finish .message').innerText = result;
}