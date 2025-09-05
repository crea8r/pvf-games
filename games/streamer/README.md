# Tetris Streamer Desktop App

A blockchain-powered Tetris game for streamers where viewers can purchase piece selections using Solana. Built with Next.js, React, and Solana Web3.js.

## 🎮 Features

- **Blockchain Integration**: Connects to Solana devnet for piece purchasing
- **Real-time Gameplay**: Standard Tetris with blockchain-influenced piece selection
- **Streamer Dashboard**: Room management, earnings tracking, and viewer analytics
- **Wallet Integration**: Solana wallet adapter with Phantom and Solflare support
- **Responsive Design**: Optimized for desktop streaming setups (1920x1080)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom or Solflare)
- Solana CLI (optional, for program deployment)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd tetris-streamer-app
npm install
```

2. **Set up environment variables:**
```bash
# Create .env.local file
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=YourProgramIdHere
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:3000
```

## 🔧 Configuration

### Program Setup

Update the `PROGRAM_ID` in `lib/solana.js`:

```javascript
export const PROGRAM_ID = new PublicKey("YourActualProgramIdHere");
```

### Wallet Configuration

The app supports Phantom and Solflare wallets by default. To add more wallets, modify `pages/index.js`:

```javascript
const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    // Add more wallet adapters here
  ],
  [network]
);
```

## 🎯 How to Use

### For Streamers:

1. **Connect Wallet**: Click the wallet button and connect your Solana wallet
2. **Claim Room**: Select an available room (0-9) and claim it with your stream info
3. **Start Game**: Begin playing Tetris - use arrow keys and spacebar
4. **Earn SOL**: Receive 0.001 SOL for each piece purchase from viewers

### For Viewers:

1. Visit the streamer's room page
2. Connect your wallet  
3. Purchase piece selections (0.001 SOL each)
4. Watch your selected pieces appear in the streamer's game

### Game Controls:

- **Arrow Keys**: Move and rotate pieces
- **Spacebar**: Hard drop
- **P**: Pause/unpause
- **R**: Restart (when game over)

## 🏗️ Architecture

```
/components
  /game
    - TetrisGame.jsx      # Main game logic and state
    - GameBoard.jsx       # Visual game board rendering  
    - NextPiece.jsx       # Next piece preview
  /ui
    - RoomSelector.jsx    # Room management interface
    - EarningsDisplay.jsx # Earnings and analytics
/lib
  - solana.js            # Blockchain connection & functions
  - tetris.js            # Core Tetris game logic
/pages  
  - index.js             # Main application page
/styles
  - globals.css          # Global styles and themes
```

## 🔗 Blockchain Integration

### Key Functions:

- `fetchRoomData(roomId)`: Gets room info from blockchain
- `claimRoom(wallet, roomId, name, url)`: Claims a room for streaming
- `getPieceFromBlockchain(pieceId)`: Converts blockchain data to Tetris pieces

### Data Flow:

1. App polls room account every 2 seconds
2. Reads `latest_chosen_piece` field (0-6)
3. Maps to Tetris piece types (I, O, T, S, Z, J, L)
4. Updates next piece in game queue

## 🎨 Customization

### Themes:

Modify `tailwind.config.js` for custom colors:

```javascript
theme: {
  extend: {
    colors: {
      tetris: {
        cyan: '#00f5ff',
        // Add your custom colors
      }
    }
  }
}
```

### Game Settings:

Update game constants in `lib/tetris.js`:

```javascript
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
// Modify for different board sizes
```

## 🚨 Error Handling

The app includes comprehensive error handling for:

- Wallet connection failures
- Blockchain read timeouts  
- Network connectivity issues
- Invalid room states
- Transaction failures

## 🔒 Security Considerations

- Never store private keys in code
- Validate all blockchain data
- Use proper error boundaries
- Implement rate limiting for API calls
- Sanitize user inputs

## 🚀 Deployment

### Vercel Deployment:

```bash
npm run build
npx vercel --prod
```

### Environment Variables:

Set these in your deployment platform:

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=YourProgramIdHere
```

## 🐛 Troubleshooting

### Common Issues:

1. **Wallet won't connect**: Clear browser cache and try different wallet
2. **Blockchain reads failing**: Check network connection and RPC endpoint
3. **Game lag**: Ensure hardware acceleration is enabled in browser
4. **Room claim fails**: Verify wallet has sufficient SOL for transaction fees

### Debug Mode:

Enable console logging by setting:

```javascript
const DEBUG = true; // In lib/solana.js
```

## 📈 Performance Optimization

- Game loop runs at 60fps for smooth gameplay
- Blockchain polling limited to 2-second intervals
- Component memoization prevents unnecessary re-renders
- Efficient board state management with immutable updates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Future Enhancements

- [ ] Mobile responsive design
- [ ] Tournament mode
- [ ] NFT piece collections  
- [ ] Multi-player rooms
- [ ] Advanced analytics dashboard
- [ ] Stream overlay integration
- [ ] Custom piece pricing
- [ ] Leaderboards and achievements
