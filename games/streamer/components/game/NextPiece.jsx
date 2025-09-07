import React from 'react';
import { PIECES } from '../../lib/tetris';

const NextPiece = ({ pieceType, fromBlockchain = false }) => {
  // Handle loading/invalid state
  if (!pieceType || !PIECES[pieceType]) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <h3 className="text-white text-sm font-semibold mb-3">Next Piece</h3>
        <div className="w-full h-24 bg-gray-900 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  const piece = PIECES[pieceType];
  if (!piece || !piece.shape) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <h3 className="text-white text-sm font-semibold mb-3">Next Piece</h3>
        <div className="w-full h-24 bg-gray-900 rounded flex items-center justify-center">
          <span className="text-red-400 text-xs">Invalid piece</span>
        </div>
      </div>
    );
  }

  const shape = piece.shape;
  
  // Use fixed 4x4 grid for consistent sizing
  const gridSize = 4;
  
  // Create centered preview with better centering logic
  const preview = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  
  // Calculate better centering offsets
  const pieceHeight = shape.length;
  const pieceWidth = Math.max(...shape.map(row => row.length));
  const offsetY = Math.max(0, Math.floor((gridSize - pieceHeight) / 2));
  const offsetX = Math.max(0, Math.floor((gridSize - pieceWidth) / 2));
  
  // Place the piece in the preview grid with bounds checking
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      const previewY = offsetY + y;
      const previewX = offsetX + x;
      
      if (previewY >= 0 && previewY < gridSize && 
          previewX >= 0 && previewX < gridSize && 
          shape[y][x]) {
        preview[previewY][previewX] = pieceType;
      }
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm font-semibold">Next Piece</h3>
        {fromBlockchain && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ⛓️ Chain
          </span>
        )}
      </div>
      <div className="flex justify-center">
        <div 
          className="grid gap-[1px] bg-gray-900 p-3 rounded-lg"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: '120px',
            height: '120px'
          }}
        >
          {preview.flat().map((cell, index) => (
            <div
              key={index}
              className={`
                rounded-sm transition-all duration-150
                ${cell === pieceType ? 
                  `${piece.color} border border-gray-600 shadow-md` : 
                  'bg-gray-800 border border-gray-700'
                }
              `}
              style={{
                minWidth: '4px',
                minHeight: '4px',
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="text-gray-400 text-sm font-mono uppercase tracking-wider">
          {pieceType}-piece
        </span>
      </div>
    </div>
  );
};

export default NextPiece;