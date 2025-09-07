import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import createClaimRoomInstruction from '../utils/createClaimRoomInstruction';
import programHook from '../utils/program';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createInitializeInstruction } from '../utils/createInitializeInstruction';
import { Buffer } from 'buffer';
// Program constants
export const PROGRAM_ID = new PublicKey(
  'FHbWQGzgrdKnuZcp4bLhE2GdwzxrGciWKUegW42yj33h'
); // Replace with actual program ID
export const DEV_WALLET = new PublicKey(
  '3eBER4Ed9z91SVFbRxEsqrVBfohsgukMz4go1vqTdzfo'
)
export const PIECE_PRICE = 1_000_000; // 0.001 SOL in lamports
export const ROOMS_COUNT = 10;

// Connection setup - use localhost for development
export const connection = new Connection('http://localhost:8899', 'confirmed');

// Get room PDA (Program Derived Address)
export function getRoomPDA(roomId) {
  const [roomPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    PROGRAM_ID
  );
  return roomPDA;
}

// Check if room is expired (2+ minutes old)
export function isRoomExpired(timestamp) {
  if (!timestamp) return false;
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = currentTime - timestamp;
  return timeDiff >= 120; // 120 seconds = 2 minutes
}

// Fetch room data from blockchain
export async function fetchRoomData(roomId) {
  try {
    const roomPDA = getRoomPDA(roomId);
    
    // Use the same connection as the rest of the app
    const program = programHook(connection);

    try {
      const roomAccount = await program.account.room.fetch(roomPDA);
      console.log('roomAccount: ', roomAccount);
      return {
        exists: true,
        latest_chosen_piece: roomAccount.latestChosenPiece,
        last_buyer: roomAccount.lastBuyer.toString(),
        timestamp: roomAccount.timestamp.toNumber(),
        room_name: roomAccount.roomName,
        stream_url: roomAccount.streamUrl,
        owner: roomAccount.playerWallet.toString(),
        expired: isRoomExpired(roomAccount.timestamp.toNumber()),
      };
    } catch (fetchError) {
      // Room doesn't exist
      return {
        exists: false,
        latest_chosen_piece: Math.floor(Math.random() * 7),
        last_buyer: null,
        timestamp: 0,
        room_name: '',
        stream_url: '',
        owner: null,
        expired: false,
      };
    }
  } catch (error) {
    console.error('Error fetching room data:', error);
    return {
      exists: false,
      latest_chosen_piece: Math.floor(Math.random() * 7),
      last_buyer: null,
      timestamp: 0,
      room_name: '',
      stream_url: '',
      owner: null,
      expired: false,
    };
  }
}

// Claim room function
export async function claimRoom(wallet, roomId, roomName, streamUrl) {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    // Create transaction
    const transaction = new Transaction();

    console.log('Creating program instance');

    // Create a provider with the wallet using the global connection
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    
    // Set the provider
    anchor.setProvider(provider);
    
    const program = programHook(connection);

    console.log('Program created with provider');

    // Add your program instruction here
    const instruction = await createClaimRoomInstruction(
      program,
      roomId, // Use the actual roomId parameter
      roomName, // program enforces max 50 chars
      streamUrl,
      wallet.publicKey // program enforces max 200 chars
    );
    console.log('instruction: ', instruction);
    transaction.add(instruction);

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error('Error claiming room:', error);
    throw error;
  }
}

// Convert blockchain piece ID to Tetris piece type
export function getPieceFromBlockchain(pieceId) {
  const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return pieces[pieceId % 7];
}

// Get available rooms
export async function getAvailableRooms() {
  const rooms = [];
  for (let i = 0; i < ROOMS_COUNT; i++) {
    const roomData = await fetchRoomData(i);
    rooms.push({
      id: i,
      ...roomData,
    });
  }
  return rooms;
}

// Get config PDA (Program Derived Address)
export function getConfigPDA() {
  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  return configPDA;
}

// Check if the app is initialized by checking if config account exists
export async function isAppInitialized() {
  try {
    const configPDA = getConfigPDA();
    const program = programHook(connection);
    
    try {
      await program.account.config.fetch(configPDA);
      return true; // Config account exists, app is initialized
    } catch (error) {
      // Config account doesn't exist, app is not initialized
      return false;
    }
  } catch (error) {
    console.error('Error checking if app is initialized:', error);
    return false; // Assume not initialized on error
  }
}

// Get piece price from config account
export async function getPiecePriceFromConfig() {
  try {
    const configPDA = getConfigPDA();
    const program = programHook(connection);
    
    try {
      const configAccount = await program.account.config.fetch(configPDA);
      console.log('configPDA: ', configAccount);
      return configAccount.piecePrice.toNumber(); // Convert BN to number
    } catch (error) {
      console.error('Error fetching config account:', error);
      return PIECE_PRICE; // Fallback to hardcoded value
    }
  } catch (error) {
    console.error('Error getting piece price from config:', error);
    return PIECE_PRICE; // Fallback to hardcoded value
  }
}

export function InitializeButton() {
  const { connection } = useConnection();
  const { wallet, sendTransaction } = useWallet();
  const program = programHook(connection);
  const onClick = async () => {
    if (!wallet) throw new Error('Connect wallet first');
    console.log('wallet: ', wallet);
    console.log('wallet.publicKey: ',wallet.adapter.publicKey.toBase58())
    const ix = await createInitializeInstruction(
      program,
      DEV_WALLET,
      wallet.adapter.publicKey
    );

    const tx = new Transaction().add(ix);
    try {
      const sig = await sendTransaction(tx, connection);
      console.log('tx:', sig);
    } catch (err) {
      console.log('error: ',err)
    }
  };

  return <button onClick={onClick}>Initialize App</button>;
}
