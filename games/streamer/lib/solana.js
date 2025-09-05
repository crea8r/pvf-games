import { Connection, clusterApiUrl, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

// Program constants
export const PROGRAM_ID = new PublicKey("CWsgKu8vFZkjjG1hpV9yBhuG6qYmBjdx2m9PzyLviNTM"); // Replace with actual program ID
export const PIECE_PRICE = 1_000_000; // 0.001 SOL in lamports
export const ROOMS_COUNT = 10;

// Connection setup
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Get room PDA (Program Derived Address)
export function getRoomPDA(roomId) {
  const [roomPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    PROGRAM_ID
  );
  return roomPDA;
}

// Fetch room data from blockchain
export async function fetchRoomData(roomId) {
  try {
    const roomPDA = getRoomPDA(roomId);
    const accountInfo = await connection.getAccountInfo(roomPDA);
    
    if (!accountInfo) {
      return {
        exists: false,
        latest_chosen_piece: Math.floor(Math.random() * 7),
        last_buyer: null,
        timestamp: Date.now(),
        room_name: '',
        stream_url: '',
        owner: null
      };
    }

    // Parse account data (this would depend on your program's data structure)
    const data = accountInfo.data;
    
    // Mock data structure - replace with actual parsing
    return {
      exists: true,
      latest_chosen_piece: data[0] % 7,
      last_buyer: new PublicKey(data.slice(1, 33)).toString(),
      timestamp: Date.now(),
      room_name: 'Room ' + roomId,
      stream_url: 'https://youtube.com/watch?v=example',
      owner: new PublicKey(data.slice(33, 65)).toString()
    };
  } catch (error) {
    console.error('Error fetching room data:', error);
    return {
      exists: false,
      latest_chosen_piece: Math.floor(Math.random() * 7),
      last_buyer: null,
      timestamp: Date.now(),
      room_name: '',
      stream_url: '',
      owner: null
    };
  }
}

// Claim room function
export async function claimRoom(wallet, roomId, roomName, streamUrl) {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    // This would be the actual claim_room instruction
    // For now, we'll create a mock transaction
    const transaction = new Transaction();
    
    // Add your program instruction here
    // const instruction = createClaimRoomInstruction({
    //   room: getRoomPDA(roomId),
    //   owner: wallet.publicKey,
    //   systemProgram: SystemProgram.programId,
    // }, {
    //   roomId,
    //   roomName,
    //   streamUrl
    // });
    // transaction.add(instruction);

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
      ...roomData
    });
  }
  return rooms;
}