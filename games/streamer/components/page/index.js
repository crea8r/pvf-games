import React, { useState, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import TetrisGame from '../components/game/TetrisGame';
import RoomSelector from '../components/ui/RoomSelector';
import EarningsDisplay from '../components/ui/EarningsDisplay';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Home() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isRoomClaimed, setIsRoomClaimed] = useState(false);
  const [roomData, setRoomData] = useState(null);

  // Wallet configuration
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Tetris Streamer
                  </h1>
                  <div className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    Blockchain-Powered Gaming
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {selectedRoom !== null && (
                    <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                      Room {selectedRoom}
                      {isRoomClaimed && (
                        <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400">
                    Solana Devnet
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
              <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">
                
                {/* Left Side - Game Area (60%) */}
                <div className="col-span-7">
                  <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Game Board</h2>
                      <div className="flex items-center space-x-2">
                        {isRoomClaimed ? (
                          <>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-sm">Live</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="text-red-400 text-sm">Offline</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isRoomClaimed ? (
                      <TetrisGame 
                        selectedRoom={selectedRoom}
                        isRoomClaimed={isRoomClaimed}
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
                <div className="col-span-5 space-y-6">
                  
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
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-6">
              <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
                <p>
                  Tetris Streamer - Powered by Solana Blockchain | 
                  <span className="ml-2">Built with Next.js & React</span>
                </p>
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}