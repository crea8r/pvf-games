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

const TetrisGame = ({ selectedRoom, isRoomClaimed, gameMode = 'normal', onGameStarted }) => {
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
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState(null);

  const gameLoopRef = useRef();
  const blockchainPollRef = useRef();
  const dropTimeRef = useRef(1000);
  const lastDropTime = useRef(Date.now());

  // Initialize game
  const initializeGame = useCallback(() => {
    const newBoard = createBoard();
    const firstPieceType = getRandomPieceType();
    const newNextPieceType = getRandomPieceType();
    const firstPiece = createPieceState(firstPieceType);
    
    setBoard(newBoard);
    setCurrentPiece(firstPiece);
    setNextPieceType(newNextPieceType);
    setNextPieceFromBlockchain(false);
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
    // Generate next piece (will be overridden by blockchain if available)
    const newNextPieceType = getRandomPieceType();
    setNextPieceType(newNextPieceType);
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
    if (gameMode !== 'streamer' || selectedRoom === null || !isRoomClaimed || gameOver || !gameStarted) return;
    
    console.log('Polling blockchain for room:', selectedRoom);
    try {
      const data = await fetchRoomData(selectedRoom);
      console.log('Fetched room data:', data);
      setRoomData(data);
      
      if (data.latest_chosen_piece !== undefined && data.latest_chosen_piece !== null && data.timestamp) {
        const currentTimestamp = data.timestamp;
        
        // Check if we have new blockchain data (different timestamp)
        if (lastSeenTimestamp === null || currentTimestamp > lastSeenTimestamp) {
          // New blockchain data - use the blockchain piece
          const blockchainPieceType = getPieceFromBlockchain(data.latest_chosen_piece);
          if (blockchainPieceType) {
            setNextPieceType(blockchainPieceType);
            setNextPieceFromBlockchain(true);
            setLastSeenTimestamp(currentTimestamp);
            console.log('Updated next piece from blockchain (new timestamp):', blockchainPieceType, 'timestamp:', currentTimestamp);
          }
        } else {
          // Same timestamp - don't change the piece, let spawnNewPiece handle it
          console.log('Blockchain data unchanged, keeping current next piece:', nextPieceType, 'timestamp:', currentTimestamp);
        }
      } else {
        // No blockchain data - don't change the piece, let spawnNewPiece handle it
        console.log('No blockchain data, keeping current next piece:', nextPieceType);
      }
    } catch (error) {
      console.error('Error polling blockchain:', error);
      // Don't change the piece on error, let spawnNewPiece handle it
    }
  }, [selectedRoom, isRoomClaimed, gameMode, lastSeenTimestamp, gameOver, gameStarted]);

  // Board click handler to start game
  const handleBoardClick = useCallback(() => {
    if (!gameStarted) {
      initializeGame();
    }
  }, [gameStarted, initializeGame]);

  // Keyboard controls
  const handleKeyPress = useCallback((event) => {
    if (!gameStarted) {
      return;
    }
    
    switch (event.key.toLowerCase()) {
      case 'arrowleft':
      // case 'a':
        event.preventDefault();
        movePiece(-1, 0);
        break;
      case 'arrowright':
      // case 'd':
        event.preventDefault();
        movePiece(1, 0);
        break;
      case 'arrowdown':
      // case 's':
        event.preventDefault();
        if (movePiece(0, 1)) {
          setScore(prev => prev + 1);
        }
        break;
      case 'arrowup':
      // case 'w':
        event.preventDefault();
        rotatePieceHandler();
        break;
      case ' ':
        event.preventDefault();
        hardDrop();
        break;
      // case 'p':
      //   setIsPaused(prev => !prev);
      //   break;
      // case 'r':
      //   if (gameOver) {
      //     initializeGame();
      //   }
      //   break;
    }
  }, [gameStarted, movePiece, rotatePieceHandler, hardDrop, gameOver, initializeGame]);

  // Setup intervals
  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 16); // ~60fps
    return () => clearInterval(gameLoopRef.current);
  }, [gameLoop]);

  useEffect(() => {
    if (gameMode === 'streamer' && selectedRoom !== null && isRoomClaimed && gameStarted) {
      console.log('Starting blockchain polling for room:', selectedRoom);
      blockchainPollRef.current = setInterval(pollBlockchain, 2000);
      // Call immediately once
      pollBlockchain();
      return () => {
        console.log('Stopping blockchain polling');
        clearInterval(blockchainPollRef.current);
      };
    }
  }, [pollBlockchain, selectedRoom, isRoomClaimed, gameMode, gameStarted]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Notify parent of game state changes
  useEffect(() => {
    if (onGameStarted) {
      onGameStarted(gameStarted);
    }
  }, [gameStarted, onGameStarted]);

  // Initialize first piece when game starts
  useEffect(() => {
    if (gameStarted && !currentPiece && !gameOver) {
      spawnNewPiece();
    }
  }, [gameStarted, currentPiece, gameOver, spawnNewPiece]);

  // Ensure next piece is always set
  useEffect(() => {
    if (gameStarted && !nextPieceType) {
      setNextPieceType(getRandomPieceType());
      setNextPieceFromBlockchain(false);
    }
  }, [gameStarted, nextPieceType]);

  const isNormalMode = gameMode === 'normal';

  return (
    <div className={`flex ${isNormalMode ? 'flex-col items-center' : 'h-full'}`}>
      {/* Game Board and Next Piece */}
      <div className={`flex gap-4 ${isNormalMode ? 'items-start' : 'flex-1 items-start'}`}>
        <div className={`flex ${isNormalMode ? 'justify-center' : 'flex-1 justify-center'} relative`}>
          <GameBoard 
            board={board} 
            currentPiece={currentPiece} 
            gameOver={gameOver}
          />
          
          {/* Start Game Overlay */}
          {!gameStarted && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="text-white text-xl font-bold mb-4">
                  {gameOver ? 'Game Over!' : 'Tetris'}
                </div>
                <button 
                  onClick={handleBoardClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Start Game
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-40">
          <NextPiece 
            pieceType={nextPieceType} 
            fromBlockchain={nextPieceFromBlockchain}
          />
          
          {/* Blockchain Info - only in streamer mode */}
          {gameMode === 'streamer' && (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 mt-3">
              <h3 className="text-white text-xs font-semibold mb-2">Room Info</h3>
              <div className="text-xs text-gray-400 space-y-1">
                {!roomData ? (
                  <div className="text-yellow-400">Loading room data...</div>
                ) : (
                  <>
                    <div>Last Buyer:</div>
                    <div className="text-white font-mono text-xs break-all">
                      {roomData.last_buyer ? 
                        `${roomData.last_buyer.slice(0, 8)}...` : 
                        'None'
                      }
                    </div>
                    <div className="text-gray-400">
                      Latest Piece: {roomData.latest_chosen_piece !== null ? 
                        getPieceFromBlockchain(roomData.latest_chosen_piece) : 'None'}
                    </div>
                    <div className="text-gray-400">
                      Exists: {roomData.exists ? 'Yes' : 'No'}
                    </div>
                    <div className="text-gray-400">
                      {roomData.timestamp ? 
                        new Date(roomData.timestamp * 1000).toLocaleTimeString() : 
                        'No timestamp'
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TetrisGame;