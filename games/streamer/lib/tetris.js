// Tetris game constants
export const BOARD_WIDTH = 15;
export const BOARD_HEIGHT = 16;

// Tetris pieces definitions
export const PIECES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 'bg-cyan-400'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-400'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: 'bg-purple-400'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: 'bg-green-400'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: 'bg-red-400'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 'bg-blue-400'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: 'bg-orange-400'
  }
};

// Create empty board
export function createBoard() {
  const b = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
  return b;
}

// Rotate piece 90 degrees clockwise
export function rotatePiece(piece) {
  const rotated = piece[0].map((_, index) =>
    piece.map(row => row[index]).reverse()
  );
  return rotated;
}

// Check if piece placement is valid
export function isValidMove(board, piece, x, y) {
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (piece[py][px]) {
        const newX = x + px;
        const newY = y + py;
        
        // Check boundaries
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false;
        }
        
        // Check collision with existing pieces
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
      }
    }
  }
  return true;
}

// Place piece on board
export function placePiece(board, piece, x, y, pieceType) {
  const newBoard = board.map(row => [...row]);
  
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (piece[py][px]) {
        const newY = y + py;
        const newX = x + px;
        if (newY >= 0) {
          newBoard[newY][newX] = pieceType;
        }
      }
    }
  }
  
  return newBoard;
}

// Clear completed lines
export function clearLines(board) {
  let linesCleared = 0;
  const newBoard = [];
  
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].some(cell => cell === 0)) {
      newBoard.push([...board[y]]);
    } else {
      linesCleared++;
    }
  }
  
  // Add empty lines at the top
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  return { board: newBoard, linesCleared };
}

// Calculate score
export function calculateScore(lines, level) {
  const baseScores = [0, 40, 100, 300, 1200];
  return baseScores[lines] * (level + 1);
}

// Get random piece type
export function getRandomPieceType() {
  const pieceTypes = Object.keys(PIECES);
  return pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
}

// Create piece state
export function createPieceState(pieceType, x = 3, y = 0) {
  return {
    type: pieceType,
    shape: PIECES[pieceType].shape,
    x,
    y,
    rotation: 0
  };
}

// Get ghost piece position (where piece would land)
export function getGhostPiecePosition(board, piece) {
  let ghostY = piece.y;
  while (isValidMove(board, piece.shape, piece.x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}