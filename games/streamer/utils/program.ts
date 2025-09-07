import * as anchor from '@coral-xyz/anchor';
import { TetrisStreaming } from './types';
import idl from './tetris_streaming.json';

export default function programHook(connection: anchor.web3.Connection) {
  const program = new anchor.Program<TetrisStreaming>(idl as TetrisStreaming, {
    connection,
  });

  return program;
}
