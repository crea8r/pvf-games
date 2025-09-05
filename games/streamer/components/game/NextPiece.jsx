import React from 'react';
import { PIECES } from '../../lib/tetris';

const NextPiece = ({ pieceType, fromBlockchain = false }) => {
  if (!pieceType || !PIECES[pieceType]) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <h3 className="text-white text-sm font-semibold mb-2">Next Piece</h3>
        <div className="w-20 h-20 bg-gray-900 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  const piece = PIECES[pieceType];
  const shape = piece.shape;
  
  // Calculate preview grid size (max 4x4)
  const maxSize = Math.max(shape.length, Math.max(...shape.map(row => row.length)));
  const gridSize = Math.max(4, maxSize);
  
  // Create centered preview
  const preview = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  const offsetY = Math.floor((gridSize - shape.length) / 2);
  const offsetX = Math.floor((gridSize - shape[0].length) / 2);
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        preview[offsetY + y][offsetX + x] = pieceType;
      }
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-sm font-semibold">Next Piece</h3>
        {fromBlockchain && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Blockchain
          </span>
        )}
      </div>
      <div 
        className="grid gap-[1px] bg-gray-900 p-2 rounded"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          width: '80px',
          height: '80px'
        }}
      >
        {preview.flat().map((cell, index) => (
          <div
            key={index}
            className={`
              border border-gray-700 rounded-sm
              ${cell === pieceType ? piece.color : 'bg-gray-900'}
              ${cell === pieceType ? 'shadow-sm' : ''}
            `}
          />
        ))}
      </div>
      <div className="mt-2 text-center">
        <span className="text-gray-400 text-xs font-mono">
          {pieceType}
        </span>
      </div>
    </div>
  );
};

export default NextPiece;