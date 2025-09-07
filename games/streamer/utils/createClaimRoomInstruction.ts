import { TetrisStreaming } from './types';

import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
export default async function createClaimRoomInstruction(
  program: anchor.Program<TetrisStreaming>,
  room_id: number,
  room_name: string,
  room_url: string,
  streamer: anchor.web3.PublicKey
) {
  console.log('Creating claim room instruction');

  const [room] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([room_id])],
    program.programId
  );
  
  console.log('Room PDA:', room.toString());
  console.log('Program ID:', program.programId.toString());
  console.log('Streamer:', streamer.toString());
  
  try {
    const instruction = await program.methods
      .claimRoom(room_id, room_name, room_url)
      .accountsPartial({
        room,
        streamer,
        systemProgram: anchor.web3.SystemProgram.programId,
      })  // Use 'as any' to bypass strict typing for now
      .instruction();
    
    console.log('Generated instruction:', instruction);
    console.log('Instruction program ID:', instruction.programId?.toString());
    
    return instruction;
  } catch (error) {
    console.error('Error creating instruction:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}
