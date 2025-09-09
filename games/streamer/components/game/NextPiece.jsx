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
        <h3 className="text-white text-sm font-semibold">Next</h3>
        {fromBlockchain && (
          <SolanaLogo/>
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

const SolanaLogo = () => { 
  return <svg 
    width="16" 
    height="16" 
    viewBox="0 0 80 80" 
    fill="none" 
    className="mr-1"
  >
    <g clipPath="url(#a)">
      <path fill="url(#b)" d="M40 80a40 40 0 1 0 0-80 40 40 0 0 0 0 80Z" />
      <path
        stroke="#fff"
        strokeOpacity=".1"
        d="M79.5 40a39.5 39.5 0 1 1-79 0 39.5 39.5 0 0 1 79 0Z"
      />
      <path
        fill="#fff"
        d="m62.62 51.54-7.54 7.91a1.75 1.75 0 0 1-1.29.55H18.02a.9.9 0 0 1-.8-.52.84.84 0 0 1 .16-.92l7.55-7.92a1.75 1.75 0 0 1 1.28-.55h35.77a.87.87 0 0 1 .8.52.84.84 0 0 1-.16.93Zm-7.54-15.95a1.75 1.75 0 0 0-1.29-.54H18.02a.89.89 0 0 0-.8.51.84.84 0 0 0 .16.93l7.55 7.92a1.75 1.75 0 0 0 1.28.54h35.77a.89.89 0 0 0 .8-.51.84.84 0 0 0-.16-.93l-7.54-7.92ZM18.02 29.9h35.77a1.79 1.79 0 0 0 1.29-.54l7.54-7.92a.85.85 0 0 0 .16-.93.87.87 0 0 0-.8-.51H26.21a1.79 1.79 0 0 0-1.28.54l-7.55 7.92a.85.85 0 0 0-.16.93.89.89 0 0 0 .8.52Z"
      />
    </g>
    <defs>
      <linearGradient id="b" x1="6.75" x2="80.68" y1="81.91" y2="7.37" gradientUnits="userSpaceOnUse">
        <stop offset=".08" stopColor="#9945FF" />
        <stop offset=".3" stopColor="#8752F3" />
        <stop offset=".5" stopColor="#5497D5" />
        <stop offset=".6" stopColor="#43B4CA" />
        <stop offset=".72" stopColor="#28E0B9" />
        <stop offset=".97" stopColor="#19FB9B" />
      </linearGradient>
      <clipPath id="a"><path fill="#fff" d="M0 0h80v80H0z" /></clipPath>
    </defs>
  </svg>
}

export default NextPiece;