import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './GameBoard';
import NextPiece from './NextPiece';
import {
  createBoard,
  rotatePiece,
  isValidMove,
  placePiece,
  clearLines,
  calculateScore,
  getRandomPieceType,
  createPieceState,
  PIECES
} from '../../lib/tetris';
import { fetchRoomData, getPieceFromBlockchain } from '../../lib/solana';

const TetrisGame = ({ selectedRoom, isRoomClaimed }) => {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieceType, setNextPieceType] = useState(getRandomPieceType());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [nextPieceFromBlockchain, setNextPieceFromBlockchain] = useState(false);
  const [roomData, setRoomData] = useState(null);

  const gameLoopRef = useRef();
  const blockchainPollRef = useRef();
  const dropTimeRef = useRef(1000);
  const lastDropTime = useRef(Date.now());

  // Initialize game
  const initializeGame = useCallback(() => {
    const newBoard = createBoard();
    const firstPieceType = getRandomPieceType();
    const firstPiece = createPieceState(firstPieceType);
    
    setBoard(newBoard);
    setCurrentPiece(firstPiece);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
    lastDropTime.current = Date.now();
  }, []);

  // Spawn new piece
  const spawnNewPiece = useCallback(() => {
    const pieceType = nextPieceType;
    const newPiece = createPieceState(pieceType);
    
    if (!isValidMove(board, newPiece.shape, newPiece.x, newPiece.y)) {
      setGameOver(true);
      return;
    }
    
    setCurrentPiece(newPiece);
    // Next piece will be set by blockchain polling or random fallback
    setNextPieceType(getRandomPieceType());
    setNextPieceFromBlockchain(false);
  }, [board, nextPieceType]);

  // Move piece
  const movePiece = useCallback((deltaX, deltaY) => {
    if (!currentPiece || gameOver || isPaused) return false;
    
    const newX = currentPiece.x + deltaX;
    const newY = currentPiece.y + deltaY;
    
    if (isValidMove(board, currentPiece.shape, newX, newY)) {
      setCurrentPiece(prev => ({ ...prev, x: newX, y: newY }));
      return true;
    }
    return false;
  }, [currentPiece, board, gameOver, isPaused]);

  // Rotate piece
  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const rotatedShape = rotatePiece(currentPiece.shape);
    
    if (isValidMove(board, rotatedShape, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(prev => ({ 
        ...prev, 
        shape: rotatedShape, 
        rotation: (prev.rotation + 90) % 360 
      }));
    }
  }, [currentPiece, board, gameOver, isPaused]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let newY = currentPiece.y;
    while (isValidMove(board, currentPiece.shape, currentPiece.x, newY + 1)) {
      newY++;
    }
    
    setCurrentPiece(prev => ({ ...prev, y: newY }));
    // Trigger immediate placement
    setTimeout(() => {
      if (currentPiece) {
        lockPiece();
      }
    }, 50);
  }, [currentPiece, board, gameOver, isPaused]);

  // Lock piece in place
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = placePiece(board, currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.type);
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    setLines(prev => prev + linesCleared);
    setScore(prev => prev + calculateScore(linesCleared, level));
    
    // Level up every 10 lines
    const newLines = lines + linesCleared;
    const newLevel = Math.floor(newLines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      dropTimeRef.current = Math.max(50, 1000 - (newLevel - 1) * 50);
    }
    
    spawnNewPiece();
  }, [currentPiece, board, lines, level, spawnNewPiece]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;
    
    const now = Date.now();
    if (now - lastDropTime.current >= dropTimeRef.current) {
      if (!movePiece(0, 1)) {
        lockPiece();
      }
      lastDropTime.current = now;
    }
  }, [gameOver, isPaused, gameStarted, movePiece, lockPiece]);

  // Blockchain polling
  const pollBlockchain = useCallback(async () => {
    if (!selectedRoom || !isRoomClaimed) return;
    
    try {
      const data = await fetchRoomData(selectedRoom);
      setRoomData(data);
      
      if (data.latest_chosen_piece !== undefined) {
        const blockchainPieceType = getPieceFromBlockchain(data.latest_chosen_piece);
        if (blockchainPieceType !== nextPieceType) {
          setNextPieceType(blockchainPieceType);
          setNextPieceFromBlockchain(true);
        }
      }
    } catch (error) {
      console.error('Error polling blockchain:', error);
    }
  }, [selectedRoom, isRoomClaimed, nextPieceType]);

  // Keyboard controls
  const handleKeyPress = useCallback((event) => {
    if (!gameStarted) {
      if (event.key === ' ' || event.key === 'Enter') {
        initializeGame();
      }
      return;
    }
    
    switch (event.key.toLowerCase()) {
      case 'arrowleft':
      case 'a':
        event.preventDefault();
        movePiece(-1, 0);
        break;
      case 'arrowright':
      case 'd':
        event.preventDefault();
        movePiece(1, 0);
        break;
      case 'arrowdown':
      case 's':
        event.preventDefault();
        if (movePiece(0, 1)) {
          setScore(prev => prev + 1);
        }
        break;
      case 'arrowup':
      case 'w':
        event.preventDefault();
        rotatePieceHandler();
        break;
      case ' ':
        event.preventDefault();
        hardDrop();
        break;
      case 'p':
        setIsPaused(prev => !prev);
        break;
      case 'r':
        if (gameOver) {
          initializeGame();
        }
        break;
    }
  }, [gameStarted, movePiece, rotatePieceHandler, hardDrop, gameOver, initializeGame]);

  // Setup intervals
  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 16); // ~60fps
    return () => clearInterval(gameLoopRef.current);
  }, [gameLoop]);

  useEffect(() => {
    if (selectedRoom !== null && isRoomClaimed) {
      blockchainPollRef.current = setInterval(pollBlockchain, 2000);
      return () => clearInterval(blockchainPollRef.current);
    }
  }, [pollBlockchain, selectedRoom, isRoomClaimed]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Initialize first piece when game starts
  useEffect(() => {
    if (gameStarted && !currentPiece && !gameOver) {
      spawnNewPiece();
    }
  }, [gameStarted, currentPiece, gameOver, spawnNewPiece]);

  return (
    <div className="flex flex-col h-full">
      {/* Game Stats */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-600">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-gray-400 text-xs">Score</div>
            <div className="text-white font-mono text-lg">{score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs">Lines</div>
            <div className="text-white font-mono text-lg">{lines}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs">Level</div>
            <div className="text-white font-mono text-lg">{level}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs">Status</div>
            <div className="text-white text-sm">
              {gameOver ? 'Game Over' : isPaused ? 'Paused' : gameStarted ? 'Playing' : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Game Board and Next Piece */}
      <div className="flex gap-4 flex-1">
        <div className="flex-1 flex justify-center">
          <GameBoard 
            board={board} 
            currentPiece={currentPiece} 
            gameOver={gameOver} 
          />
        </div>
        
        <div className="w-32">
          <NextPiece 
            pieceType={nextPieceType} 
            fromBlockchain={nextPieceFromBlockchain}
          />
          
          {/* Blockchain Info */}
          {roomData && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mt-4">
              <h3 className="text-white text-sm font-semibold mb-2">Room Info</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Last Buyer:</div>
                <div className="text-white font-mono text-xs break-all">
                  {roomData.last_buyer ? 
                    `${roomData.last_buyer.slice(0, 8)}...` : 
                    'None'
                  }
                </div>
                <div className="text-gray-400">
                  {new Date(roomData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Help */}
      <div className="bg-gray-800 p-3 rounded-lg mt-4 border border-gray-600">
        <div className="text-gray-400 text-xs text-center">
          {!gameStarted ? (
            <span>Press SPACE or ENTER to start</span>
          ) : (
            <span>
              ← → Move | ↑ Rotate | ↓ Soft Drop | SPACE Hard Drop | P Pause | R Restart
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;