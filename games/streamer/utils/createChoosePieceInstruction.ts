import { TetrisStreaming } from './types';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

export const createChoosePieceInstruction = async (
  program: anchor.Program<TetrisStreaming>,
  roomId: number,
  pieceType: number,
  buyerWallet: anchor.web3.PublicKey,
  streamerWallet: anchor.web3.PublicKey
) => {
  console.log('Creating choose piece instruction...');
  console.log('roomId:', roomId);
  console.log('pieceType:', pieceType);
  console.log('buyerWallet:', buyerWallet.toString());
  console.log('streamerWallet:', streamerWallet.toString());

  // Derive PDAs
  const [config] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  );

  const [room] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    program.programId
  );

  // Get dev wallet from constants
  const DEV_WALLET = new anchor.web3.PublicKey(
    '3eBER4Ed9z91SVFbRxEsqrVBfohsgukMz4go1vqTdzfo'
  );

  const instruction = await program.methods
    .choosePiece(roomId, pieceType)
    .accountsPartial({
      config,
      room,
      buyer: buyerWallet,
      streamer: streamerWallet,
      devWallet: DEV_WALLET,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .instruction();

  return instruction;
};