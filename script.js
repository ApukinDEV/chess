let selectedPiece = null;
let selectedPiecePosition = null;
let enPassantTarget = null;
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookMoved = [false, false]; // [left rook, right rook]
let blackRookMoved = [false, false]; // [left rook, right rook]
let freeModeEnabled = false;
let currentPlayer = 'white';
let gameEnded = false;

let whiteTime = 60; // 10 minutes in seconds
let blackTime = 60; // 10 minutes in seconds
let timerInterval = null;
const board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

document.getElementById('free-mode-checkbox').addEventListener('change', function() {
  freeModeEnabled = this.checked;
});

function initializeDragAndDrop() {
    const boardElement = document.getElementById('board');
    boardElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseDown(event) {
    const target = event.target;
    if (gameEnded || (!freeModeEnabled && ((currentPlayer === 'white' && target.textContent.toLowerCase() === target.textContent) || (currentPlayer === 'black' && target.textContent.toUpperCase() === target.textContent)))) {
        return;
    }
    if (target.classList.contains('piece')) {
        selectedPiece = target;
        selectedPiecePosition = {
            x: event.clientX - target.offsetLeft,
            y: event.clientY - target.offsetTop,
            fromRow: parseInt(target.parentElement.dataset.row),
            fromCol: parseInt(target.parentElement.dataset.col)
        };
        target.style.position = 'absolute';
        target.style.zIndex = 1000;

        // Highlight valid moves
        highlightValidMoves(selectedPiecePosition.fromRow, selectedPiecePosition.fromCol);
    }
}


function onMouseUp(event) {
    if (selectedPiece) {
        const boardElement = document.getElementById('board');
        const boardRect = boardElement.getBoundingClientRect();
        const toRow = Math.floor((event.clientY - boardRect.top) / 100);
        const toCol = Math.floor((event.clientX - boardRect.left) / 100);

        if (freeModeEnabled || isValidMove(selectedPiecePosition.fromRow, selectedPiecePosition.fromCol, toRow, toCol)) {
            movePiece(selectedPiecePosition.fromRow, selectedPiecePosition.fromCol, toRow, toCol);
            if (!freeModeEnabled) {
                switchTurn();
            }
        }

        selectedPiece.style.position = 'relative';
        selectedPiece.style.zIndex = 1;
        selectedPiece.style.left = '0';
        selectedPiece.style.top = '0';
        selectedPiece = null;

        // Clear highlights
        clearHighlights();
    }
}



function onMouseMove(event) {
    if (selectedPiece) {
        selectedPiece.style.left = `${event.clientX - selectedPiecePosition.x}px`;
        selectedPiece.style.top = `${event.clientY - selectedPiecePosition.y}px`;
    }
}
function highlightValidMoves(fromRow, fromCol) {
    clearHighlights();
    for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(fromRow, fromCol, toRow, toCol,false,)) {
                const square = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);
                if (square) {
                    square.classList.add('highlight');
                }
            }
        }
    }
}

function clearHighlights() {
    const highlightedSquares = document.querySelectorAll('.highlight');
    highlightedSquares.forEach(square => square.classList.remove('highlight'));
}

function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    document.body.style.background =currentPlayer === 'white' ? '#ddd' : '#222';
    if (isInCheck(currentPlayer)) {
        if (isCheckmate(currentPlayer)) {
            endGame(currentPlayer === 'white' ? 'black' : 'white');
        } else {
            alert(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
        }
    }
    resetTimer();
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (gameEnded) {
        clearInterval(timerInterval);
        return;
    }

    if (currentPlayer === 'white') {
        whiteTime--;
        if (whiteTime <= 0) {
            endGame('black');
        }
        document.getElementById('white').textContent = formatTime(whiteTime);
        document.getElementById('white').style.flex = whiteTime.toString();
    } else {
        blackTime--;
        if (blackTime <= 0) {
            endGame('white');
        }
        document.getElementById('black').textContent = formatTime(blackTime);
        document.getElementById('black').style.flex = blackTime.toString();
    }
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function endGame(winner) {
    gameEnded = true;
    clearInterval(timerInterval);
    alert(`${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = fromRow < toRow ? 1 : fromRow > toRow ? -1 : 0;
    const colStep = fromCol < toCol ? 1 : fromCol > toCol ? -1 : 0;

    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;

    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol] !== ' ') {
            return false;
        }
        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}

function findKing(player) {
    const king = player === 'white' ? 'K' : 'k';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === king) {
                return { row, col };
            }
        }
    }
    return null;
}

function isValidMove(fromRow, fromCol, toRow, toCol, lookingForCheck) {
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];

    // Ensure the correct player is moving their pieces
    if (!freeModeEnabled && !lookingForCheck) {
        if ((currentPlayer === 'white' && piece !== piece.toUpperCase()) || (currentPlayer === 'black' && piece !== piece.toLowerCase())) {
            return false;
        }
    }

    // Prevent capturing own pieces
    if (targetPiece !== ' ' && isSameColor(piece, targetPiece)) {
        return false;
    }

    // Prevent capturing own pieces
    if (targetPiece !== ' ' && isSameColor(piece, targetPiece)) {
        return false;
    }

    // Save the original en passant target
    const originalEnPassantTarget = enPassantTarget;

    // Simulate the move and check for check condition
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = ' ';

    const inCheck = isInCheck(currentPlayer);

    // Undo the move
    board[fromRow][fromCol] = piece;
    board[toRow][toCol] = targetPiece;

    // Restore the original en passant target
    enPassantTarget = originalEnPassantTarget;

    if (inCheck) {
        return false;
    }

    switch (piece.toLowerCase()) {
        case 'p': return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
        case 'n': return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'b': return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'r': return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'q': return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'k': return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default: return false;
    }
}


function isSameColor(piece1, piece2) {
    return (piece1.toLowerCase() === piece1 && piece2.toLowerCase() === piece2) ||
        (piece1.toUpperCase() === piece1 && piece2.toUpperCase() === piece2);
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, piece, skipenpassant) {
    const direction = piece === 'P' ? -1 : 1;
    const startRow = piece === 'P' ? 6 : 1;
    const opponentPawn = piece === 'P' ? 'p' : 'P';

    // Regular move forward
    if (fromCol === toCol && board[toRow][toCol] === ' ' &&
        ((toRow - fromRow === direction) ||
            (toRow - fromRow === 2 * direction && fromRow === startRow && board[fromRow + direction][fromCol] === ' '))) {
        return true;
    }

    // Standard capture
    if (Math.abs(fromCol - toCol) === 1 && toRow - fromRow === direction) {
        if (board[toRow][toCol] !== ' ' && !isSameColor(piece, board[toRow][toCol])) {
            if(!skipenpassant) {
            enPassantTarget = null;
            }
            return true;
        }
        // En passant capture
        if (board[toRow][toCol] === ' ' && enPassantTarget &&
            (enPassantTarget.row-direction) === fromRow && enPassantTarget.col === toCol &&
            board[fromRow][toCol] === opponentPawn) {
            return true;
        }
    }

    return false;
}


function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    if (rowDiff === colDiff) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
    }
    return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow === toRow || fromCol === toCol) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
    }
    return false;
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidBishopMove(fromRow, fromCol, toRow, toCol) || isValidRookMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);

    // Standard king move
    if (rowDiff <= 1 && colDiff <= 1) {
        return true;
    }

    // Castling move
    if (rowDiff === 0 && Math.abs(fromCol - toCol) === 2) {
        return isCastling(fromRow, fromCol, toRow, toCol);
    }

    return false;
}

function isCastling(fromRow, fromCol, toRow, toCol) {
    if (fromRow === 7 && toRow === 7) { // White castling
        if (fromCol === 4 && (toCol === 2 || toCol === 6)) {
            if (!whiteKingMoved && ((toCol === 2 && !whiteRookMoved[0]) || (toCol === 6 && !whiteRookMoved[1]))) {
                return isCastlingPathClear(fromRow, fromCol, toCol) && !isInCheck(currentPlayer);
            }
        }
    } else if (fromRow === 0 && toRow === 0) { // Black castling
        if (fromCol === 4 && (toCol === 2 || toCol === 6)) {
            if (!blackKingMoved && ((toCol === 2 && !blackRookMoved[0]) || (toCol === 6 && !blackRookMoved[1]))) {
                return isCastlingPathClear(fromRow, fromCol, toCol) && !isInCheck(currentPlayer);
            }
        }
    }
    return false;
}


function isCastlingPathClear(row, fromCol, toCol) {
    const step = fromCol < toCol ? 1 : -1;
    for (let col = fromCol + step; col !== toCol; col += step) {
        if (board[row][col] !== ' ') {
            return false;
        }
    }
    return true;
}


function isInCheck(player) {
    const kingPos = findKing(player);
    if (!kingPos) return false;

    const opponent = player === 'white' ? 'black' : 'white';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if ((opponent === 'white' && piece === piece.toUpperCase()) || (opponent === 'black' && piece === piece.toLowerCase())) {
                if (isValidMove(row, col, kingPos.row, kingPos.col,true)) {
                    return true;
                }
            }
        }
    }
    return false;
}


function isCheckmate(player) {
    if (!isInCheck(player)) return false;

    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if ((player === 'white' && piece === piece.toUpperCase()) || (player === 'black' && piece === piece.toLowerCase())) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        const backup = board[toRow][toCol];
                        if (isValidMove(fromRow, fromCol, toRow, toCol,false)) {
                            // Make the move
                            board[toRow][toCol] = piece;
                            board[fromRow][fromCol] = ' ';

                            const kingInCheck = isInCheck(player);

                            // Undo the move
                            board[fromRow][fromCol] = piece;
                            board[toRow][toCol] = backup;

                            if (!kingInCheck) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }
    return true;
}



function movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];

    // Handle en passant capture
    if (piece.toLowerCase() === 'p' && targetPiece === ' ' &&
        enPassantTarget && enPassantTarget.row === (fromRow-(piece === 'P' ? 1 : -1)) && enPassantTarget.col === toCol) {
        console.log('this happened')
        const captureRow = piece === 'P' ? toRow + 1 : toRow - 1;
        board[captureRow][toCol] = ' ';
    }

    // Perform the move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = ' ';

    // Set en passant target if moving two squares
    if (piece.toLowerCase() === 'p' && Math.abs(fromRow - toRow) === 2) {
        enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    } else {
        enPassantTarget = null;
    }

    // Update castling movement flags
    if (piece === 'K') whiteKingMoved = true;
    if (piece === 'k') blackKingMoved = true;
    if (piece === 'R' && fromRow === 7) whiteRookMoved[fromCol === 0 ? 0 : 1] = true;
    if (piece === 'r' && fromRow === 0) blackRookMoved[fromCol === 0 ? 0 : 1] = true;

    // Handle castling movement
    if (piece.toLowerCase() === 'k' && Math.abs(fromCol - toCol) > 1) {
        if (toCol === 2) { // Queen-side castling
            board[toRow][3] = board[toRow][0];
            board[toRow][0] = ' ';
        } else if (toCol === 6) { // King-side castling
            board[toRow][5] = board[toRow][7];
            board[toRow][7] = ' ';
        }
    }

    // Handle pawn promotion
    if ((piece === 'P' && toRow === 0) || (piece === 'p' && toRow === 7)) {
        promotePawn(toRow, toCol, piece);
    }

    renderBoard();

    // Check for check and checkmate
    if (isInCheck(currentPlayer)) {
        if (isCheckmate(currentPlayer)) {
            endGame(currentPlayer === 'white' ? 'black' : 'white');
        } else {
            alert(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
        }
    }

    return true;
}




function promotePawn(row, col, piece) {
    const newPiece = prompt("Promote pawn to (q/r/b/n):").toLowerCase();
    if (['q', 'r', 'b', 'n'].includes(newPiece)) {
        board[row][col] = piece === 'P' ? newPiece.toUpperCase() : newPiece;
    } else {
        alert("Invalid promotion piece. Promoting to queen by default.");
        board[row][col] = piece === 'P' ? 'Q' : 'q';
    }
    renderBoard(); // Ensure the board is rendered with the new piece
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = board[row][col];
            if (piece !== ' ') {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece');
                pieceElement.textContent = piece;
                if(piece.toUpperCase()===piece){

                    pieceElement.style.color="white";
                }
                square.appendChild(pieceElement);
            }

            boardElement.appendChild(square);
        }
    }

    // Re-attach event listeners for pieces
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(piece => {
        piece.addEventListener('mousedown', onMouseDown);
    });
}



initializeDragAndDrop();
renderBoard();

