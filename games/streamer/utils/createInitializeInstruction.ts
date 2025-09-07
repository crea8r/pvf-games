import { TetrisStreaming } from './types';

import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

export const createInitializeInstruction = async (
  program: anchor.Program<TetrisStreaming>,
  devWallet: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey
) => {
  console.log('program.provider: ', program.provider);
  console.log('authority:', authority)
  const [config] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  );
  const initIns = await program.methods
    .initialize(devWallet)
    .accountsPartial({
      systemProgram: anchor.web3.SystemProgram.programId,
      authority: authority,
      config,
    })
    .instruction();

  return initIns;
};
