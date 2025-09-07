import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { claimRoom, getAvailableRooms, ROOMS_COUNT, isAppInitialized, DEV_WALLET } from '../../lib/solana';
import { getRoomExpirationStatus } from '../../utils/roomExpiration';
import { createInitializeInstruction } from '../../utils/createInitializeInstruction';
import programHook from '../../utils/program';
import { Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

const RoomSelector = ({ selectedRoom, setSelectedRoom, isRoomClaimed, setIsRoomClaimed }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { sendTransaction } = useWallet();
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimingRoom, setClaimingRoom] = useState(false);
  const [appInitialized, setAppInitialized] = useState(null);
  const [initializing, setInitializing] = useState(false);

  // Check if app is initialized
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const initialized = await isAppInitialized();
        setAppInitialized(initialized);
      } catch (error) {
        console.error('Error checking app initialization:', error);
        setAppInitialized(false);
      }
    };

    checkInitialization();
  }, []);

  // Load available rooms
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const availableRooms = await getAvailableRooms();
        setRooms(availableRooms);
      } catch (error) {
        console.error('Error loading rooms:', error);
        // Fallback to dummy data
        const dummyRooms = Array.from({ length: ROOMS_COUNT }, (_, i) => ({
          id: i,
          exists: i < 3, // First 3 rooms are claimed
          room_name: i < 3 ? `Streamer ${i + 1}` : '',
          owner: i < 3 ? 'Mock Owner' : null,
          latest_chosen_piece: Math.floor(Math.random() * 7)
        }));
        setRooms(dummyRooms);
      }
      setLoading(false);
    };

    // Only load rooms if app is initialized
    if (appInitialized) {
      loadRooms();
      const interval = setInterval(loadRooms, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [appInitialized]);

  // Check if user owns the selected room
  useEffect(() => {
    if (selectedRoom !== null && wallet.publicKey && rooms.length > 0) {
      const room = rooms[selectedRoom];
      const isOwner = room?.owner === wallet.publicKey.toString();
      setIsRoomClaimed(isOwner);
    } else {
      setIsRoomClaimed(false);
    }
  }, [selectedRoom, wallet.publicKey, rooms, setIsRoomClaimed]);

  const handleClaimRoom = async () => {
    if (!wallet.connected || selectedRoom === null || !roomName.trim()) {
      alert('Please connect wallet, select a room, and enter a room name');
      return;
    }

    const room = rooms[selectedRoom];
    if (room?.exists && !room?.expired) {
      alert('Room is already claimed and not expired');
      return;
    }

    setClaimingRoom(true);
    try {
      await claimRoom(wallet, selectedRoom, roomName.trim(), streamUrl.trim());
      
      // Update room data
      const updatedRooms = [...rooms];
      const wasReclaiming = updatedRooms[selectedRoom]?.expired;
      updatedRooms[selectedRoom] = {
        ...updatedRooms[selectedRoom],
        exists: true,
        room_name: roomName.trim(),
        stream_url: streamUrl.trim(),
        owner: wallet.publicKey.toString(),
        expired: false,
        timestamp: Math.floor(Date.now() / 1000)
      };
      setRooms(updatedRooms);
      setIsRoomClaimed(true);
      
      alert(wasReclaiming ? 'Room reclaimed successfully!' : 'Room claimed successfully!');
    } catch (error) {
      console.error('Error claiming room:', error);
      alert('Failed to claim room: ' + error.message);
    }
    setClaimingRoom(false);
  };

  const handleInitializeApp = async () => {
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setInitializing(true);
    try {
      console.log('Initializing app...');
      console.log('wallet:', wallet);
      console.log('wallet.publicKey:', wallet.publicKey?.toBase58());
      
      const program = programHook(connection);
      const ix = await createInitializeInstruction(
        program,
        DEV_WALLET,
        wallet.publicKey
      );

      const tx = new Transaction().add(ix);
      console.log('Transaction created:', tx);
      
      // Sign and send the transaction using the sendTransaction from useWallet
      const signature = await sendTransaction(tx, connection, {
        skipPreflight: true
      });
      console.log('Transaction signature:', signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('Transaction confirmed');
      
      // Update initialization status
      setAppInitialized(true);
      alert('App initialized successfully!');
    } catch (error) {
      console.error('Error initializing app:', error);
      alert('Failed to initialize app: ' + (error.message || error.toString()));
    }
    setInitializing(false);
  };

  const getRoomStatus = (room) => {
    if (!room.exists) return 'Available';
    if (room.owner === wallet.publicKey?.toString()) return 'Owned by you';
    if (room.expired) return 'Expired (Claimable)';
    return 'Claimed';
  };

  const getRoomStatusColor = (room) => {
    if (!room.exists) return 'text-green-400';
    if (room.owner === wallet.publicKey?.toString()) return 'text-blue-400';
    if (room.expired) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
      <h2 className="text-white text-xl font-bold mb-4">Room Management</h2>
      
      {/* Wallet Connection */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-2">Wallet Connection</label>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        {wallet.connected && (
          <div className="mt-2 text-xs text-gray-400">
            Connected: {wallet.publicKey?.toString().slice(0, 8)}...
          </div>
        )}
      </div>

      {/* App Initialization */}
      {appInitialized === false && wallet.connected && (
        <div className="mb-6 p-4 bg-yellow-900 border border-yellow-600 rounded">
          <h3 className="text-yellow-400 font-semibold mb-2">⚠️ App Not Initialized</h3>
          <p className="text-yellow-300 text-sm mb-4">
            The Tetris Streaming app needs to be initialized before you can use it. This is a one-time setup that creates the necessary program configuration.
          </p>
          <button
            onClick={handleInitializeApp}
            disabled={initializing}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded transition-colors"
          >
            {initializing ? 'Initializing App...' : 'Initialize App'}
          </button>
        </div>
      )}

      {/* Loading state for initialization check */}
      {appInitialized === null && (
        <div className="mb-6 p-4 bg-gray-700 border border-gray-600 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
            <span className="text-gray-300">Checking app status...</span>
          </div>
        </div>
      )}

      {/* Room Selection */}
      {appInitialized === true && (
        <>
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">Select Room</label>
            {loading ? (
              <div className="text-gray-400">Loading rooms...</div>
            ) : (
              <select
                value={selectedRoom !== null ? selectedRoom : ''}
                onChange={(e) => setSelectedRoom(e.target.value === '' ? null : parseInt(e.target.value))}
                className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select a room...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.id} - {getRoomStatus(room)}
                    {room.room_name && ` (${room.room_name})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Room Info */}
          {selectedRoom !== null && rooms[selectedRoom] && (
        <div className="mb-6 p-4 bg-gray-700 rounded border border-gray-600">
          <h3 className="text-white font-semibold mb-2">Room {selectedRoom} Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={getRoomStatusColor(rooms[selectedRoom])}>
                {getRoomStatus(rooms[selectedRoom])}
              </span>
            </div>
            {rooms[selectedRoom].room_name && (
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{rooms[selectedRoom].room_name}</span>
              </div>
            )}
            {rooms[selectedRoom].stream_url && (
              <div className="flex justify-between">
                <span className="text-gray-400">Stream:</span>
                <a 
                  href={rooms[selectedRoom].stream_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 truncate max-w-32"
                >
                  Link
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Latest Piece:</span>
              <span className="text-white font-mono">
                {rooms[selectedRoom].latest_chosen_piece}
              </span>
                </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Latest Buyer:</span>
              <span className="text-white font-mono">
                {rooms[selectedRoom].last_buyer}
              </span>
            </div>
            {rooms[selectedRoom].timestamp > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last Activity:</span>
                <span className="text-white text-sm">
                  {new Date(rooms[selectedRoom].timestamp * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {rooms[selectedRoom].exists && (
              <div className="flex justify-between">
                <span className="text-gray-400">Room Status:</span>
                <span className={getRoomExpirationStatus(rooms[selectedRoom].timestamp).color + ' text-sm font-semibold'}>
                  {getRoomExpirationStatus(rooms[selectedRoom].timestamp).status}
                </span>
              </div>
            )}
            {rooms[selectedRoom].expired && (
              <div className="p-2 bg-yellow-900 border border-yellow-600 rounded mt-2">
                <span className="text-yellow-400 text-sm font-semibold">⚠️ This room has expired and can be claimed!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Room Form */}
      {selectedRoom !== null && rooms[selectedRoom] && (!rooms[selectedRoom].exists || rooms[selectedRoom].expired) && wallet.connected && (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Room Name *</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter your stream name"
              className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
              maxLength={50}
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-2">YouTube Stream URL</label>
            <input
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <button
            onClick={handleClaimRoom}
            disabled={claimingRoom || !roomName.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded transition-colors"
          >
            {claimingRoom ? 
              (rooms[selectedRoom]?.expired ? 'Reclaiming Room...' : 'Claiming Room...') : 
              (rooms[selectedRoom]?.expired ? 'Reclaim Room' : 'Claim Room')
            }
          </button>
        </div>
      )}

          {/* Game Ready Status */}
          {isRoomClaimed && (
            <div className="mt-6 p-4 bg-green-900 border border-green-600 rounded">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                <span className="text-green-400 font-semibold">Room Ready - Start Playing!</span>
              </div>
              <p className="text-green-300 text-sm mt-2">
                Your game will receive piece selections from the blockchain.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoomSelector;