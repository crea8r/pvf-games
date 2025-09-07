import React from 'react';
import { PIECES } from '../../lib/tetris';

const CELL_SIZE = 'w-6 h-6'; // Original smaller cell size

const GameBoard = ({ board, currentPiece, gameOver }) => {
  // Create visual board with current piece overlay
  const visualBoard = board.map(row => [...row]);
  
  // Add current piece to visual board
  if (currentPiece) {
    for (let py = 0; py < currentPiece.shape.length; py++) {
      for (let px = 0; px < currentPiece.shape[py].length; px++) {
        if (currentPiece.shape[py][px]) {
          const x = currentPiece.x + px;
          const y = currentPiece.y + py;
          if (y >= 0 && y < board.length && x >= 0 && x < board[0].length) {
            visualBoard[y][x] = currentPiece.type;
          }
        }
      }
    }
  }

  // Get cell color based on piece type
  const getCellColor = (cellValue) => {
    if (cellValue === 0) return 'bg-gray-900 border-gray-800';
    return `${PIECES[cellValue]?.color || 'bg-gray-500'} border-gray-600`;
  };

  return (
    <div className="inline-block bg-gray-800 p-4 rounded-lg border-2 border-gray-600">
      <div className="grid gap-px bg-gray-700 p-2 rounded" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
        {visualBoard.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`${CELL_SIZE} border ${getCellColor(cell)} ${
                gameOver ? 'opacity-50' : ''
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;