// src/pages/Mining/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { miningService, MiningResult } from '@/service/mining';
import { M_ETH_TOKEN } from '@/constant/tokens/M_ETH';
import { ZERO_ADDRESS, DEAD_ADDRESS } from '@/constant';

export const MiningPage: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [totalMined, setTotalMined] = useState(0);
  const [successfulMines, setSuccessfulMines] = useState(0);
  const [isAutoMining, setIsAutoMining] = useState(false);
  const [lastResult, setLastResult] = useState<MiningResult | null>(null);
  const [isMining, setIsMining] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [maxSupply, setMaxSupply] = useState(0);
  const [canMine, setCanMine] = useState(true);

  // Load wallet address from extension
  useEffect(() => {
    const loadWallet = async () => {
      try {
        // Get current wallet from background
        // This assumes Rabby has a way to get current address
        const address = await getCurrentWalletAddress();
        if (address) {
          setWalletAddress(address);
          miningService.setWallet(address);
          
          // Load stored balance
          const storedBalance = localStorage.getItem(`m_eth_balance_${address}`);
          if (storedBalance) {
            setBalance(parseFloat(storedBalance));
          }
        }
      } catch (error) {
        console.error('Failed to load wallet:', error);
      }
    };
    
    loadWallet();
    
    // Load max supply
    const loadMaxSupply = async () => {
      const max = await miningService.getMaxMiningLimit();
      setMaxSupply(max);
    };
    loadMaxSupply();
  }, []);

  // Listen for mining rewards
  useEffect(() => {
    const handleMiningReward = (event: CustomEvent) => {
      const { amount, wallet, totalMined: newTotal } = event.detail;
      setBalance(prev => prev + amount);
      setTotalMined(newTotal);
      setSuccessfulMines(miningService.getSuccessfulMines());
      setCanMine(miningService.canMine());
      
      // Save to localStorage
      if (wallet) {
        localStorage.setItem(`m_eth_balance_${wallet}`, (balance + amount).toString());
      }
    };
    
    const handleAutoMiningResult = (event: CustomEvent) => {
      const result: MiningResult = event.detail;
      setLastResult(result);
      setTotalMined(miningService.getTotalMined());
      setSuccessfulMines(miningService.getSuccessfulMines());
      setCanMine(miningService.canMine());
    };
    
    window.addEventListener('mining-reward', handleMiningReward as EventListener);
    window.addEventListener('auto-mining-result', handleAutoMiningResult as EventListener);
    
    return () => {
      window.removeEventListener('mining-reward', handleMiningReward as EventListener);
      window.removeEventListener('auto-mining-result', handleAutoMiningResult as EventListener);
    };
  }, [balance]);

  const handleMine = async (guess: 0 | 1) => {
    if (isMining) return;
    if (!canMine) {
      alert(`Max supply reached! Max M_ETH: ${maxSupply}`);
      return;
    }
    
    setIsMining(true);
    try {
      const result = await miningService.mine(guess);
      setLastResult(result);
      setTotalMined(miningService.getTotalMined());
      setSuccessfulMines(miningService.getSuccessfulMines());
      setCanMine(miningService.canMine());
      
      if (result.win) {
        setBalance(prev => prev + result.reward);
      }
    } catch (error) {
      console.error('Mining failed:', error);
      alert('Mining failed. Make sure you are logged in.');
    } finally {
      setIsMining(false);
    }
  };

  const handleAutoMineToggle = () => {
    if (isAutoMining) {
      miningService.stopAutoMining();
      setIsAutoMining(false);
    } else {
      if (!canMine) {
        alert(`Max supply reached! Max M_ETH: ${maxSupply}`);
        return;
      }
      miningService.startAutoMining(0, 2000); // Guess 0 every 2 seconds
      setIsAutoMining(true);
    }
  };

  const getAddressLabel = (address: string): string => {
    if (address.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
      return '🔥 Zero Address (Minting Source)';
    }
    if (address.toLowerCase() === DEAD_ADDRESS.toLowerCase()) {
      return '⛏️ Dead Address (Mining Source)';
    }
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  const winRate = miningService.getWinRate();

  return (
    <div className="mining-page">
      <div className="mining-header">
        <h1>⛏️ M_ETH Mining</h1>
        <p>Mine M_ETH by guessing 0 or 1. 50% win chance!</p>
        <p>1 M_ETH = 1 ETH (backed by {maxSupply} ETH reserves)</p>
      </div>

      <div className="mining-stats">
        <div className="stat-card">
          <div className="stat-label">Your M_ETH Balance</div>
          <div className="stat-value">{balance.toFixed(4)} M_ETH</div>
          <div className="stat-sub">≈ {balance.toFixed(4)} ETH</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Mined</div>
          <div className="stat-value">{totalMined.toFixed(4)} M_ETH</div>
          <div className="stat-sub">of {maxSupply} max</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Successful Mines</div>
          <div className="stat-value">{successfulMines}</div>
          <div className="stat-sub">Win Rate: {(winRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="mining-controls">
        <div className="guess-buttons">
          <button 
            className="mine-btn mine-0"
            onClick={() => handleMine(0)}
            disabled={isMining || !canMine}
          >
            🔮 MINE 0
          </button>
          <button 
            className="mine-btn mine-1"
            onClick={() => handleMine(1)}
            disabled={isMining || !canMine}
          >
            🔮 MINE 1
          </button>
        </div>
        
        <button 
          className="auto-mine-btn"
          onClick={handleAutoMineToggle}
          disabled={!canMine}
        >
          {isAutoMining ? '⏹️ Stop Auto-Mining' : '⚡ Start Auto-Mining'}
        </button>
      </div>

      {lastResult && (
        <div className={`mining-result ${lastResult.win ? 'win' : 'lose'}`}>
          {lastResult.win ? (
            <>
              <div className="result-icon">✅</div>
              <div className="result-text">WIN! +{lastResult.reward} M_ETH</div>
              <div className="result-details">
                Mined from: {getAddressLabel(lastResult.from)}<br />
                Block: {lastResult.blockNumber}<br />
                Your guess: {lastResult.guess} | Block value: {lastResult.blockValue}
              </div>
            </>
          ) : (
            <>
              <div className="result-icon">❌</div>
              <div className="result-text">LOSE. Try again!</div>
              <div className="result-details">
                Your guess: {lastResult.guess} | Block value: {lastResult.blockValue}
              </div>
            </>
          )}
        </div>
      )}

      {!canMine && totalMined >= maxSupply && (
        <div className="max-supply-warning">
          ⚠️ Max supply of {maxSupply} M_ETH reached! No more M_ETH can be mined.
        </div>
      )}

      <div className="mining-info">
        <h3>How Mining Works</h3>
        <ul>
          <li>Each block on Base has a hash ending in 0-15</li>
          <li>We take the last digit and mod 2 → 0 or 1</li>
          <li>If you guess correctly, you win 1 M_ETH</li>
          <li>M_ETH is backed 1:1 by real ETH in the Zero and Dead addresses</li>
          <li>Max supply: {maxSupply} M_ETH</li>
        </ul>
      </div>

      <style>{`
        .mining-page {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          color: #fff;
        }
        .mining-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .mining-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .mining-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
        }
        .stat-sub {
          font-size: 12px;
          opacity: 0.5;
          margin-top: 4px;
        }
        .guess-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 20px;
        }
        .mine-btn {
          font-size: 24px;
          padding: 20px 40px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.2s;
        }
        .mine-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .mine-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .mine-0 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .mine-1 {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .auto-mine-btn {
          width: 100%;
          padding: 12px;
          background: #2d3748;
          border: 1px solid #4a5568;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }
        .auto-mine-btn:hover:not(:disabled) {
          background: #4a5568;
        }
        .mining-result {
          margin-top: 24px;
          padding: 20px;
          border-radius: 16px;
          text-align: center;
        }
        .mining-result.win {
          background: rgba(72, 187, 120, 0.2);
          border: 1px solid #48bb78;
        }
        .mining-result.lose {
          background: rgba(245, 87, 108, 0.2);
          border: 1px solid #f5576c;
        }
        .result-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }
        .result-text {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .result-details {
          font-size: 12px;
          opacity: 0.7;
        }
        .max-supply-warning {
          margin-top: 20px;
          padding: 12px;
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          text-align: center;
        }
        .mining-info {
          margin-top: 32px;
          padding: 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
        }
        .mining-info h3 {
          margin-bottom: 12px;
        }
        .mining-info ul {
          margin: 0;
          padding-left: 20px;
        }
        .mining-info li {
          margin: 8px 0;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

// Helper function to get current wallet address from Rabby extension
async function getCurrentWalletAddress(): Promise<string | null> {
  // This assumes you're running in the extension context
  // You may need to adjust this based on Rabby's API
  try {
    // Method 1: Check if window.ethereum exists (Rabby injects this)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    }
    
    // Method 2: Use Rabby's internal API
    // This might need adjustment based on Rabby's actual API
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_CURRENT_ADDRESS' }, (response) => {
          resolve(response?.address || null);
        });
      });
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get wallet address:', error);
    return null;
  }
}
