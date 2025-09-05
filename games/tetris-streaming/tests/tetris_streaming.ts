import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TetrisStreaming } from "../target/types/tetris_streaming";
import { expect } from "chai";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("tetris_streaming", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.TetrisStreaming as Program<TetrisStreaming>;
  const provider = anchor.getProvider();

  let devWallet: Keypair;
  let authority: Keypair;
  let streamer: Keypair;
  let buyer: Keypair;
  let configPDA: PublicKey;
  let roomPDA: PublicKey;
  const roomId = 1;

  before(async () => {
    devWallet = Keypair.generate();
    authority = Keypair.generate();
    streamer = Keypair.generate();
    buyer = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(streamer.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(buyer.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(devWallet.publicKey, 1 * LAMPORTS_PER_SOL);

    // Wait for airdrops to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Derive PDAs
    [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    [roomPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("room"), Buffer.from([roomId])],
      program.programId
    );
  });

  describe("initialize", () => {
    it("should initialize config successfully", async () => {
      const tx = await program.methods
        .initialize(devWallet.publicKey)
        .accounts({
          config: configPDA,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const config = await program.account.config.fetch(configPDA);
      expect(config.devWallet.toString()).to.equal(devWallet.publicKey.toString());
      expect(config.piecePrice.toNumber()).to.equal(1_000_000);
    });

    it("should fail to initialize with existing config", async () => {
      try {
        await program.methods
          .initialize(devWallet.publicKey)
          .accounts({
            config: configPDA,
            authority: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("claim_room", () => {
    it("should claim room successfully", async () => {
      const roomName = "Test Room";
      const streamUrl = "https://twitch.tv/test";

      const tx = await program.methods
        .claimRoom(roomId, roomName, streamUrl)
        .accounts({
          room: roomPDA,
          streamer: streamer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([streamer])
        .rpc();

      const room = await program.account.room.fetch(roomPDA);
      expect(room.roomName).to.equal(roomName);
      expect(room.streamUrl).to.equal(streamUrl);
      expect(room.playerWallet.toString()).to.equal(streamer.publicKey.toString());
      expect(room.latestChosenPiece).to.equal(0);
      expect(room.lastBuyer.toString()).to.equal(PublicKey.default.toString());
    });

    it("should fail with invalid room id", async () => {
      const invalidRoomId = 10;
      try {
        await program.methods
          .claimRoom(invalidRoomId, "Test", "https://test.com")
          .accounts({
            room: PublicKey.findProgramAddressSync(
              [Buffer.from("room"), Buffer.from([invalidRoomId])],
              program.programId
            )[0],
            streamer: streamer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([streamer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Invalid room ID");
      }
    });

    it("should fail with room name too long", async () => {
      const longName = "a".repeat(51);
      try {
        await program.methods
          .claimRoom(2, longName, "https://test.com")
          .accounts({
            room: PublicKey.findProgramAddressSync(
              [Buffer.from("room"), Buffer.from([2])],
              program.programId
            )[0],
            streamer: streamer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([streamer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Room name too long");
      }
    });

    it("should fail with stream URL too long", async () => {
      const longUrl = "https://" + "a".repeat(200);
      try {
        await program.methods
          .claimRoom(3, "Test", longUrl)
          .accounts({
            room: PublicKey.findProgramAddressSync(
              [Buffer.from("room"), Buffer.from([3])],
              program.programId
            )[0],
            streamer: streamer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([streamer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Stream URL too long");
      }
    });
  });

  describe("choose_piece", () => {
    it("should choose piece successfully and transfer payments", async () => {
      const pieceType = 3; // S-piece

      // Get initial balances
      const streamerBalanceBefore = await provider.connection.getBalance(streamer.publicKey);
      const devBalanceBefore = await provider.connection.getBalance(devWallet.publicKey);
      const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

      const tx = await program.methods
        .choosePiece(roomId, pieceType)
        .accounts({
          config: configPDA,
          room: roomPDA,
          buyer: buyer.publicKey,
          streamer: streamer.publicKey,
          devWallet: devWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Get final balances
      const streamerBalanceAfter = await provider.connection.getBalance(streamer.publicKey);
      const devBalanceAfter = await provider.connection.getBalance(devWallet.publicKey);
      const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);

      // Check room state
      const room = await program.account.room.fetch(roomPDA);
      expect(room.latestChosenPiece).to.equal(pieceType);
      expect(room.lastBuyer.toString()).to.equal(buyer.publicKey.toString());

      // Check payment distribution (70% to streamer, 30% to dev)
      const expectedStreamerAmount = 700_000; // 70% of 1_000_000
      const expectedDevAmount = 300_000; // 30% of 1_000_000

      expect(streamerBalanceAfter - streamerBalanceBefore).to.equal(expectedStreamerAmount);
      expect(devBalanceAfter - devBalanceBefore).to.equal(expectedDevAmount);
      
      // Buyer should have paid at least the full amount (may include transaction fees)
      expect(buyerBalanceBefore - buyerBalanceAfter).to.be.greaterThanOrEqual(1_000_000);
    });

    it("should fail with invalid room id", async () => {
      const invalidRoomId = 10;
      try {
        await program.methods
          .choosePiece(invalidRoomId, 1)
          .accounts({
            config: configPDA,
            room: PublicKey.findProgramAddressSync(
              [Buffer.from("room"), Buffer.from([invalidRoomId])],
              program.programId
            )[0],
            buyer: buyer.publicKey,
            streamer: streamer.publicKey,
            devWallet: devWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Error");
      }
    });

    it("should fail with invalid piece type", async () => {
      const invalidPieceType = 7;
      try {
        await program.methods
          .choosePiece(roomId, invalidPieceType)
          .accounts({
            config: configPDA,
            room: roomPDA,
            buyer: buyer.publicKey,
            streamer: streamer.publicKey,
            devWallet: devWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Invalid piece type");
      }
    });

    it("should fail with wrong streamer wallet", async () => {
      const wrongStreamer = Keypair.generate();
      await provider.connection.requestAirdrop(wrongStreamer.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await program.methods
          .choosePiece(roomId, 1)
          .accounts({
            config: configPDA,
            room: roomPDA,
            buyer: buyer.publicKey,
            streamer: wrongStreamer.publicKey,
            devWallet: devWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Invalid");
      }
    });

    it("should fail with wrong dev wallet", async () => {
      const wrongDevWallet = Keypair.generate();
      await provider.connection.requestAirdrop(wrongDevWallet.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await program.methods
          .choosePiece(roomId, 1)
          .accounts({
            config: configPDA,
            room: roomPDA,
            buyer: buyer.publicKey,
            streamer: streamer.publicKey,
            devWallet: wrongDevWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Invalid dev wallet");
      }
    });

    it("should handle all valid piece types (0-6)", async () => {
      for (let pieceType = 0; pieceType <= 6; pieceType++) {
        // Skip piece type 3 as we already tested it
        if (pieceType === 3) continue;

        const tx = await program.methods
          .choosePiece(roomId, pieceType)
          .accounts({
            config: configPDA,
            room: roomPDA,
            buyer: buyer.publicKey,
            streamer: streamer.publicKey,
            devWallet: devWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();

        const room = await program.account.room.fetch(roomPDA);
        expect(room.latestChosenPiece).to.equal(pieceType);
      }
    });
  });

  describe("edge cases and integration", () => {
    it("should handle multiple room claims", async () => {
      const streamer2 = Keypair.generate();
      await provider.connection.requestAirdrop(streamer2.publicKey, 2 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 500));

      const roomId2 = 5;
      const [roomPDA2] = PublicKey.findProgramAddressSync(
        [Buffer.from("room"), Buffer.from([roomId2])],
        program.programId
      );

      await program.methods
        .claimRoom(roomId2, "Second Room", "https://youtube.com/test")
        .accounts({
          room: roomPDA2,
          streamer: streamer2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([streamer2])
        .rpc();

      const room2 = await program.account.room.fetch(roomPDA2);
      expect(room2.roomName).to.equal("Second Room");
      expect(room2.playerWallet.toString()).to.equal(streamer2.publicKey.toString());
    });

    it("should preserve timestamp accuracy", async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      
      await program.methods
        .choosePiece(roomId, 2)
        .accounts({
          config: configPDA,
          room: roomPDA,
          buyer: buyer.publicKey,
          streamer: streamer.publicKey,
          devWallet: devWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      const afterTime = Math.floor(Date.now() / 1000);
      const room = await program.account.room.fetch(roomPDA);
      
      expect(room.timestamp.toNumber()).to.be.greaterThanOrEqual(beforeTime - 5);
      expect(room.timestamp.toNumber()).to.be.lessThanOrEqual(afterTime + 5);
    });
  });
});
