import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { connection, PIECE_PRICE } from '../../lib/solana';

const EarningsDisplay = ({ selectedRoom, roomData }) => {
  const wallet = useWallet();
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [piecesSold, setPiecesSold] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet.publicKey) return;
      
      try {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    if (wallet.connected) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [wallet.connected, wallet.publicKey]);

  // Mock earnings data (in real app, fetch from blockchain)
  useEffect(() => {
    if (selectedRoom !== null && roomData) {
      // Simulate some earnings data
      const mockEarnings = {
        total: Math.random() * 5, // Random SOL amount
        today: Math.random() * 1,
        pieces: Math.floor(Math.random() * 100),
        transactions: [
          {
            buyer: 'ABC...XYZ',
            amount: 0.001,
            timestamp: Date.now() - 300000,
            piece: 'T'
          },
          {
            buyer: 'DEF...UVW',
            amount: 0.001,
            timestamp: Date.now() - 600000,
            piece: 'I'
          },
          {
            buyer: 'GHI...RST',
            amount: 0.001,
            timestamp: Date.now() - 900000,
            piece: 'L'
          }
        ]
      };
      
      setTotalEarnings(mockEarnings.total);
      setTodayEarnings(mockEarnings.today);
      setPiecesSold(mockEarnings.pieces);
      setRecentTransactions(mockEarnings.transactions);
    }
  }, [selectedRoom, roomData]);

  const formatSOL = (amount) => {
    return amount.toFixed(4);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!wallet.connected) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
        <h2 className="text-white text-xl font-bold mb-4">Earnings</h2>
        <div className="text-gray-400 text-center py-8">
          Connect your wallet to view earnings
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
      <h2 className="text-white text-xl font-bold mb-4">Earnings Dashboard</h2>
      
      {/* Wallet Balance */}
      <div className="mb-6 p-4 bg-gray-700 rounded border border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Wallet Balance</span>
          <span className="text-white text-lg font-mono">{formatSOL(balance)} SOL</span>
        </div>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded border border-gray-600">
          <div className="text-gray-400 text-xs mb-1">Total Earnings</div>
          <div className="text-green-400 text-lg font-mono">{formatSOL(totalEarnings)} SOL</div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded border border-gray-600">
          <div className="text-gray-400 text-xs mb-1">Today</div>
          <div className="text-green-400 text-lg font-mono">{formatSOL(todayEarnings)} SOL</div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded border border-gray-600">
          <div className="text-gray-400 text-xs mb-1">Pieces Sold</div>
          <div className="text-white text-lg font-mono">{piecesSold}</div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded border border-gray-600">
          <div className="text-gray-400 text-xs mb-1">Piece Price</div>
          <div className="text-white text-lg font-mono">{formatSOL(PIECE_PRICE / 1e9)} SOL</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-white text-sm font-semibold mb-3">Recent Piece Purchases</h3>
        {recentTransactions.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentTransactions.map((tx, index) => (
              <div key={index} className="bg-gray-700 p-3 rounded border border-gray-600">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white text-sm font-mono">{tx.buyer}</div>
                    <div className="text-gray-400 text-xs">{formatTime(tx.timestamp)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-mono">+{formatSOL(tx.amount)} SOL</div>
                    <div className="text-gray-400 text-xs">Piece: {tx.piece}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4 text-sm">
            No recent transactions
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="mt-6 pt-4 border-t border-gray-600">
        <h3 className="text-white text-sm font-semibold mb-3">Performance</h3>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Avg. per hour:</span>
            <span className="text-white font-mono">{formatSOL(todayEarnings / 8)} SOL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Revenue rate:</span>
            <span className="text-white">{piecesSold > 0 ? Math.round((piecesSold / 100) * 100) : 0}% pieces sold</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Stream status:</span>
            <span className={selectedRoom !== null ? "text-green-400" : "text-red-400"}>
              {selectedRoom !== null ? "Active" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-600">
        <button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
          onClick={() => {
            // In a real app, this would open a withdrawal interface
            alert('Withdrawal feature coming soon!');
          }}
        >
          Withdraw Earnings
        </button>
      </div>
    </div>
  );
};

export default EarningsDisplay;