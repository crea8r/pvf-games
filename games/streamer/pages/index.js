import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Dynamic imports to disable SSR for components that use browser APIs
const TetrisGame = dynamic(() => import('../components/game/TetrisGame'), {
  ssr: false
});

const RoomSelector = dynamic(() => import('../components/ui/RoomSelector'), {
  ssr: false
});

const EarningsDisplay = dynamic(() => import('../components/ui/EarningsDisplay'), {
  ssr: false
});

const ViewerMode = dynamic(() => import('../components/ui/ViewerMode'), {
  ssr: false
});

function HomeContent() {
  const [gameMode, setGameMode] = useState(null); // 'normal' or 'streamer'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isRoomClaimed, setIsRoomClaimed] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Wallet configuration
  // const network = WalletAdapterNetwork.Devnet;
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const network = 'http://127.0.0.1:8899';
  const endpoint = useMemo(() => 'http://127.0.0.1:8899');
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Tetris Game
          </h1>
          <p className="text-gray-400 mb-12 text-lg">
            Choose your game mode
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Normal Game Mode */}
            <div 
              onClick={() => setGameMode('normal')}
              className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600 hover:border-purple-400 cursor-pointer transition-all duration-200 hover:scale-105"
            >
              <div className="text-3xl mb-3">🎮</div>
              <h2 className="text-xl font-bold mb-3 text-white">Normal Game</h2>
              <p className="text-gray-400 mb-3 text-sm">
                Play classic Tetris with standard piece generation
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• Single player mode</li>
                <li>• Standard Tetris rules</li>
                <li>• No blockchain integration</li>
                <li>• Instant start</li>
              </ul>
            </div>

            {/* Streamer Mode */}
            <div 
              onClick={() => setGameMode('streamer')}
              className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600 hover:border-pink-400 cursor-pointer transition-all duration-200 hover:scale-105"
            >
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="text-xl font-bold mb-3 text-white">Streamer Mode</h2>
              <p className="text-gray-400 mb-3 text-sm">
                Play with blockchain-powered piece selection and earn SOL
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• Blockchain integration</li>
                <li>• Viewer piece purchases</li>
                <li>• Real earnings in SOL</li>
                <li>• Room management</li>
              </ul>
            </div>

            {/* Viewer Mode */}
            <div 
              onClick={() => setGameMode('viewer')}
              className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600 hover:border-blue-400 cursor-pointer transition-all duration-200 hover:scale-105"
            >
              <div className="text-3xl mb-3">👀</div>
              <h2 className="text-xl font-bold mb-3 text-white">Viewer Mode</h2>
              <p className="text-gray-400 mb-3 text-sm">
                Watch streams and influence gameplay by purchasing pieces
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• Watch active streams</li>
                <li>• Buy piece selections</li>
                <li>• Interactive viewing</li>
                <li>• Blockchain powered</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setGameMode(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {gameMode === 'normal' ? 'Tetris Game' : 
                     gameMode === 'streamer' ? 'Tetris Streamer' : 'Viewer Mode'}
                  </h1>
                  {gameMode === 'streamer' && (
                    <div className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                      Blockchain-Powered Gaming
                    </div>
                  )}
                  {gameMode === 'viewer' && (
                    <div className="bg-blue-700 px-3 py-1 rounded-full text-xs text-gray-300">
                      Interactive Streaming
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  {gameMode === 'streamer' && selectedRoom !== null && (
                    <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                      Room {selectedRoom}
                      {isRoomClaimed && (
                        <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                      )}
                    </div>
                  )}
                  
                  {gameMode === 'streamer' && (
                    <div className="flex items-center space-x-2">
                      {isRoomClaimed ? (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm font-medium">Live</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="text-red-400 text-sm font-medium">Offline</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {gameMode === 'streamer' && (
                    <div className="text-sm text-gray-400">
                      Solana Devnet
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4">
              {gameMode === 'normal' ? (
                /* Normal Game Mode - Full Width Game */
                <div className="flex justify-center">
                  <div style={{height: 'calc(100vh - 160px)', width: 'fit-content'}}>
                    <TetrisGame gameMode="normal" onGameStarted={setGameStarted} />
                  </div>
                </div>
              ) : gameMode === 'viewer' ? (
                /* Viewer Mode - Full Screen Viewer Interface */
                <ViewerMode />
              ) : (
                /* Streamer Mode - Game + Dashboard Layout */
                <div className="grid grid-cols-12 gap-4" style={{height: 'calc(100vh - 160px)'}}>
                  
                  {/* Left Side - Game Area (60%) */}
                  <div className="col-span-7">
                    <div className="bg-gray-800 rounded-lg border border-gray-600 p-4 h-full">
                      {isRoomClaimed ? (
                        <TetrisGame 
                          selectedRoom={selectedRoom}
                          isRoomClaimed={isRoomClaimed}
                          gameMode="streamer"
                          onGameStarted={setGameStarted}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <div className="text-6xl mb-4">🎮</div>
                            <h3 className="text-xl font-semibold mb-2">Ready to Stream?</h3>
                            <p className="text-gray-400 mb-4">
                              Connect your wallet and claim a room to start playing Tetris with blockchain-powered piece selection.
                            </p>
                            <div className="text-sm text-gray-500">
                              Viewers can purchase piece selections for 0.001 SOL each
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Controls & Info (40%) */}
                  <div className="col-span-5 space-y-6 h-full overflow-y-auto">
                    
                    {/* Room Management */}
                    <RoomSelector
                      selectedRoom={selectedRoom}
                      setSelectedRoom={setSelectedRoom}
                      isRoomClaimed={isRoomClaimed}
                      setIsRoomClaimed={setIsRoomClaimed}
                    />

                    {/* Earnings Display */}
                    <EarningsDisplay
                      selectedRoom={selectedRoom}
                      roomData={roomData}
                    />

                    {/* Game Instructions */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <h3 className="text-white font-semibold mb-3">How It Works</h3>
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-start space-x-2">
                          <span className="text-purple-400 font-bold">1.</span>
                          <span>Connect your Solana wallet and claim a room</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-purple-400 font-bold">2.</span>
                          <span>Start streaming and playing Tetris</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-purple-400 font-bold">3.</span>
                          <span>Viewers buy piece selections (0.001 SOL each)</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-purple-400 font-bold">4.</span>
                          <span>Your game uses blockchain pieces as next pieces</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-purple-400 font-bold">5.</span>
                          <span>Earn SOL from each piece purchase!</span>
                        </div>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <h3 className="text-white font-semibold mb-3">System Status</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Blockchain:</span>
                          <span className="text-green-400">Connected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Game Engine:</span>
                          <span className="text-green-400">Running</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Piece Polling:</span>
                          <span className={isRoomClaimed ? "text-green-400" : "text-gray-500"}>
                            {isRoomClaimed ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Room Status:</span>
                          <span className={isRoomClaimed ? "text-green-400" : "text-yellow-400"}>
                            {isRoomClaimed ? "Claimed" : "Unclaimed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-6">
              <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
                {gameStarted && (gameMode === 'normal' || gameMode === 'streamer') ? (
                  <p>
                    ← → Move | ↑ Rotate | ↓ Soft Drop | SPACE Hard Drop | P Pause | R Restart
                  </p>
                ) : (
                  <p>
                    Tetris Streamer - Powered by Solana Blockchain | 
                    <span className="ml-2">Built with Next.js & React</span>
                  </p>
                )}
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default dynamic(() => Promise.resolve(HomeContent), {
  ssr: false
});