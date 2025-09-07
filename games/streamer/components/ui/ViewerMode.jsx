import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getAvailableRooms, getPiecePriceFromConfig } from '../../lib/solana';
import { PIECES } from '../../lib/tetris';
import { Transaction } from '@solana/web3.js';
import { createChoosePieceInstruction } from '../../utils/createChoosePieceInstruction';
import programHook from '../../utils/program';
import * as anchor from '@coral-xyz/anchor';
import TetrisPiecePreview from './TetrisPiecePreview';

const ViewerMode = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { sendTransaction } = useWallet();
  
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [piecePrice, setPiecePrice] = useState(0);

  // Load available rooms
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const availableRooms = await getAvailableRooms();
        const activeRooms = availableRooms.filter(room => room.exists);
        setRooms(activeRooms);
      } catch (error) {
        console.error('Error loading rooms:', error);
        const dummyRooms = [
          {
            id: 0,
            exists: true,
            room_name: 'ProGamer Stream',
            stream_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            owner: 'DemoStreamer1',
            latest_chosen_piece: 3,
            timestamp: Date.now() / 1000,
          },
          {
            id: 1,
            exists: true,
            room_name: 'Tetris Master',
            stream_url: 'https://www.youtube.com/embed/Alw5hs0chj0',
            owner: 'DemoStreamer2', 
            latest_chosen_piece: 1,
            timestamp: Date.now() / 1000,
          }
        ];
        setRooms(dummyRooms);
      }
      setLoading(false);
    };

    loadRooms();
    const interval = setInterval(loadRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load piece price from config
  useEffect(() => {
    const loadPiecePrice = async () => {
      try {
        const price = await getPiecePriceFromConfig();
        setPiecePrice(price);
      } catch (error) {
        console.error('Error loading piece price:', error);
        setPiecePrice(1_000_000); // Fallback to default
      }
    };
    
    loadPiecePrice();
  }, []);

  // Extract YouTube video ID from URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Purchase piece
  const handlePurchasePiece = async (pieceType) => {
    if (!wallet.connected || !selectedRoom || purchasing) {
      return;
    }

    if (!wallet.publicKey) {
      alert('Please connect your wallet');
      return;
    }

    const pieceIndex = Object.keys(PIECES).indexOf(pieceType);
    if (pieceIndex === -1) {
      alert('Invalid piece type');
      return;
    }

    setPurchasing(true);
    setSelectedPiece(pieceType);

    try {
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
      );
      anchor.setProvider(provider);

      const program = programHook(connection);
      
      const ix = await createChoosePieceInstruction(
        program,
        selectedRoom.id,
        pieceIndex,
        wallet.publicKey,
        selectedRoom.owner
      );

      const tx = new Transaction().add(ix);
      
      const signature = await sendTransaction(tx, connection, {
        skipPreflight: true
      });
      console.log('signature: ', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      
      const solAmount = piecePrice / 1_000_000_000;
      alert(`Successfully purchased ${pieceType}-piece for ${solAmount} SOL!`);
      
      setTimeout(() => {
        const loadRooms = async () => {
          const availableRooms = await getAvailableRooms();
          const activeRooms = availableRooms.filter(room => room.exists);
          setRooms(activeRooms);
        };
        loadRooms();
      }, 2000);
      
    } catch (error) {
      console.error('Error purchasing piece:', error);
      alert('Failed to purchase piece: ' + (error.message || error.toString()));
    }
    
    setPurchasing(false);
    setSelectedPiece(null);
  };

  const selectedRoomData = selectedRoom ? rooms.find(r => r.id === selectedRoom.id) : null;

  // Filter rooms to show only active streams (within 2 minutes)
  const activeRooms = rooms.filter(room => {
    if (!room.timestamp) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - room.timestamp;
    return timeDiff < 120; // Less than 2 minutes
  });

  return (
    <div>
      <div className="grid grid-cols-12 gap-4" style={{height: 'calc(100vh - 160px)'}}>
        {/* Left Side - Merged Controls */}
        <div className="col-span-3">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 h-full flex flex-col">
            
            {/* Active Streams Dropdown */}
            <div className="mb-4">
              <select
                value={selectedRoom?.id ?? ''}
                onChange={(e) => {
                  const roomId = e.target.value;
                  if (roomId === '') {
                    setSelectedRoom(null);
                  } else {
                    const room = activeRooms.find(r => r.id === parseInt(roomId));
                    setSelectedRoom(room);
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">
                  {loading ? 'Loading...' : activeRooms.length === 0 ? 'No active streams' : 'Select a stream'}
                </option>
                {activeRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_name} (Room #{room.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Wallet Connection */}
            <div className="mb-4">
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 w-full !text-sm !py-2" />
              {wallet.connected && (
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {wallet.publicKey?.toString().slice(0, 8)}...
                </div>
              )}
            </div>

            {/* Piece Selection */}
            <div className="flex-1">
              {!selectedRoomData ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🎮</div>
                  <p className="text-gray-400 text-xs">Select a stream first</p>
                </div>
              ) : !wallet.connected ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🔐</div>
                  <p className="text-gray-400 text-xs">Connect wallet to buy pieces</p>
                </div>
              ) : (
                <div>
                  <div className="mb-3 p-2 bg-blue-900/20 rounded-lg border border-blue-600">
                    <div className="text-center">
                      <div className="text-blue-400 text-xs font-medium">Price</div>
                      <div className="text-white text-sm font-bold">
                        {piecePrice ? (piecePrice / 1_000_000).toFixed(3) : '...'} SOL
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(PIECES).map((pieceType) => (
                      <button
                        key={pieceType}
                        onClick={() => handlePurchasePiece(pieceType)}
                        disabled={purchasing}
                        className={`
                          p-2 rounded-lg border-2 transition-all duration-200 text-center
                          ${purchasing && selectedPiece === pieceType
                            ? 'border-yellow-400 bg-yellow-900/20'
                            : 'border-gray-600 bg-gray-700 hover:border-blue-400 hover:bg-blue-900/20'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <div className="flex justify-center mb-1">
                          <TetrisPiecePreview pieceType={pieceType} size="small" />
                        </div>
                        {purchasing && selectedPiece === pieceType && (
                          <div className="text-yellow-400 text-xs">Purchasing...</div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 p-2 bg-gray-700 rounded-lg text-xs text-gray-400">
                    <p className="mb-1">💡 Purchase becomes next piece in game!</p>
                    <p>⚡ 70% to streamer, 30% to development</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Stream Display (Expanded) */}
        <div className="col-span-9">
          {selectedRoomData ? (
            <div className="bg-gray-800 rounded-lg border border-gray-600 p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-bold">{selectedRoomData.room_name}</h2>
                <span className="text-white">
                    Last updated: {new Date(selectedRoomData.timestamp * 1000).toLocaleTimeString()}
                  </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-sm font-medium">LIVE</span>
                </div>
              </div>
              
              {selectedRoomData.stream_url ? (
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedRoomData.stream_url)}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${selectedRoomData.room_name} Stream`}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📺</div>
                    <p className="text-gray-400">Stream not available</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-600 p-8 text-center h-full flex items-center justify-center">
              <div>
                <div className="text-6xl mb-4">📺</div>
                <h2 className="text-xl font-bold mb-2">Select a Stream</h2>
                <p className="text-gray-400">
                  Choose an active stream from the dropdown to start watching and interacting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerMode;