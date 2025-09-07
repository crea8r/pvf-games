use anchor_lang::prelude::*;

declare_id!("FHbWQGzgrdKnuZcp4bLhE2GdwzxrGciWKUegW42yj33h");

#[program]
pub mod tetris_streaming {
    use super::*;
    use anchor_lang::system_program;

    pub fn initialize(ctx: Context<Initialize>, dev_wallet: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.dev_wallet = dev_wallet;
        config.piece_price = 1_000_000; // 0.001 SOL in lamports
        
        Ok(())
    }

    pub fn claim_room(
        ctx: Context<ClaimRoom>,
        room_id: u8,
        room_name: String,
        stream_url: String,
    ) -> Result<()> {
        require!(room_id < 10, ErrorCode::InvalidRoomId);
        require!(room_name.len() <= 50, ErrorCode::RoomNameTooLong);
        require!(stream_url.len() <= 200, ErrorCode::StreamUrlTooLong);

        let room = &mut ctx.accounts.room;
        let current_time = Clock::get()?.unix_timestamp;
        
        // If room already exists, check if it's expired (2+ minutes old)
        if room.timestamp != 0 {
            let time_diff = current_time - room.timestamp;
            require!(time_diff >= 120, ErrorCode::RoomNotExpired); // 120 seconds = 2 minutes
        }
        
        room.room_name = room_name;
        room.stream_url = stream_url;
        room.player_wallet = ctx.accounts.streamer.key();
        room.latest_chosen_piece = 0; // Default to first piece (I-piece)
        room.last_buyer = Pubkey::default();
        room.timestamp = current_time;

        Ok(())
    }

    pub fn choose_piece(
        ctx: Context<ChoosePiece>,
        room_id: u8,
        piece_type: u8,
    ) -> Result<()> {
        require!(room_id < 10, ErrorCode::InvalidRoomId);
        require!(piece_type < 7, ErrorCode::InvalidPieceType);

        let config = &ctx.accounts.config;
        let room = &mut ctx.accounts.room;
        
        // Transfer SOL: 70% to streamer, 30% to dev
        msg!("piece price: {}",config.piece_price);
        let streamer_amount = (config.piece_price * 70) / 100;
        let dev_amount = config.piece_price - streamer_amount;

        // Transfer to streamer
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.streamer.to_account_info(),
                },
            ),
            streamer_amount,
        )?;

        // Transfer to dev
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.dev_wallet.to_account_info(),
                },
            ),
            dev_amount,
        )?;

        // Update room state
        room.latest_chosen_piece = piece_type;
        room.last_buyer = ctx.accounts.buyer.key();
        room.timestamp = Clock::get()?.unix_timestamp;
        msg!("next piece: {}",room.latest_chosen_piece);
        msg!("last_buyer: {}",ctx.accounts.buyer.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8, // discriminator + pubkey + u64
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct ClaimRoom<'info> {
    #[account(
        init_if_needed,
        payer = streamer,
        space = 8 + 50 + 200 + 32 + 1 + 32 + 8, // discriminator + room_name + stream_url + player_wallet + piece + last_buyer + timestamp
        seeds = [b"room", room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub room: Account<'info, Room>,
    
    #[account(mut)]
    pub streamer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct ChoosePiece<'info> {
    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(
        mut,
        seeds = [b"room", room_id.to_le_bytes().as_ref()],
        bump,
        constraint = room.player_wallet == streamer.key() @ ErrorCode::InvalidStreamer
    )]
    pub room: Account<'info, Room>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: This is the streamer's wallet that receives payment
    #[account(mut)]
    pub streamer: UncheckedAccount<'info>,
    
    /// CHECK: This is the dev wallet from config
    #[account(
        mut,
        constraint = dev_wallet.key() == config.dev_wallet @ ErrorCode::InvalidDevWallet
    )]
    pub dev_wallet: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub dev_wallet: Pubkey,
    pub piece_price: u64,
}

#[account]
pub struct Room {
    pub room_name: String,
    pub stream_url: String,
    pub player_wallet: Pubkey,
    pub latest_chosen_piece: u8, // 0-6: I, O, T, S, Z, J, L pieces
    pub last_buyer: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid room ID. Must be 0-9.")]
    InvalidRoomId,
    #[msg("Room name too long. Max 50 characters.")]
    RoomNameTooLong,
    #[msg("Stream URL too long. Max 200 characters.")]
    StreamUrlTooLong,
    #[msg("Invalid piece type. Must be 0-6.")]
    InvalidPieceType,
    #[msg("Only the room owner can receive payments.")]
    InvalidStreamer,
    #[msg("Invalid dev wallet.")]
    InvalidDevWallet,
    #[msg("Room is not expired yet. Wait 2 minutes before reclaiming.")]
    RoomNotExpired,
}