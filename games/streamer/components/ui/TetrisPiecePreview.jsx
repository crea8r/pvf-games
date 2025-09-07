import React from 'react';
import { PIECES } from '../../lib/tetris';

const TetrisPiecePreview = ({ pieceType, size = 'small', className = '' }) => {
  if (!pieceType || !PIECES[pieceType]) {
    return null;
  }

  const piece = PIECES[pieceType];
  const shape = piece.shape;
  
  // Different sizes
  const sizeConfig = {
    small: {
      cellSize: 'w-2 h-2',
      containerSize: '40px',
      gap: 'gap-px'
    },
    medium: {
      cellSize: 'w-3 h-3', 
      containerSize: '60px',
      gap: 'gap-px'
    },
    large: {
      cellSize: 'w-4 h-4',
      containerSize: '80px', 
      gap: 'gap-1'
    }
  };

  const config = sizeConfig[size];
  const gridSize = 4; // Fixed 4x4 grid for consistent sizing
  
  // Create centered preview
  const preview = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  
  // Calculate centering offsets
  const pieceHeight = shape.length;
  const pieceWidth = Math.max(...shape.map(row => row.length));
  const offsetY = Math.max(0, Math.floor((gridSize - pieceHeight) / 2));
  const offsetX = Math.max(0, Math.floor((gridSize - pieceWidth) / 2));
  
  // Place the piece in the preview grid
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
    <div 
      className={`inline-flex justify-center ${className}`}
      style={{ 
        width: config.containerSize,
        height: config.containerSize
      }}
    >
      <div 
        className={`grid ${config.gap} p-1`}
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          width: '100%',
          height: '100%'
        }}
      >
        {preview.flat().map((cell, index) => (
          <div
            key={index}
            className={`
              ${config.cellSize} rounded-sm
              ${cell === pieceType ? 
                `${piece.color} border border-gray-600` : 
                'bg-transparent'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default TetrisPiecePreview;