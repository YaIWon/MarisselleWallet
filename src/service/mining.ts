// src/service/mining.ts

import { ethers } from 'ethers';
import { ZERO_ADDRESS, DEAD_ADDRESS } from '@/constant';
import { M_ETH_TOKEN } from '@/constant/tokens/M_ETH';

export type MiningResult = {
  win: boolean;
  reward: number;
  from: string;
  blockNumber: number;
  guess: number;
  blockValue: number;
};

class MiningService {
  private static instance: MiningService;
  private provider: ethers.JsonRpcProvider;
  private currentWallet: string = '';
  private totalMined: number = 0;
  private successfulMines: number = 0;
  private isMining: boolean = false;
  private miningInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Base Mainnet RPC
    this.provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  }
  
  static getInstance(): MiningService {
    if (!MiningService.instance) {
      MiningService.instance = new MiningService();
    }
    return MiningService.instance;
  }
  
  setWallet(address: string): void {
    this.currentWallet = address;
  }
  
  async mine(guess: 0 | 1): Promise<MiningResult> {
    if (!this.currentWallet) {
      throw new Error('No wallet set. Call setWallet() first.');
    }
    
    // Get latest block
    const block = await this.provider.getBlock('latest');
    if (!block) {
      throw new Error('Failed to get block');
    }
    
    // Get last digit of block hash (0-15), then mod 2 = 0 or 1
    const lastDigit = parseInt(block.hash.slice(-1), 16);
    const blockValue = lastDigit % 2;
    
    const win = guess === blockValue;
    const reward = win ? 1 : 0; // 1 M_ETH per win
    
    if (win) {
      this.totalMined += reward;
      this.successfulMines++;
      
      // Dispatch event to update UI and store balance
      window.dispatchEvent(new CustomEvent('mining-reward', {
        detail: {
          amount: reward,
          from: this.getRandomMiningSource(),
          wallet: this.currentWallet,
          totalMined: this.totalMined,
        }
      }));
    }
    
    return {
      win,
      reward,
      from: this.getRandomMiningSource(),
      blockNumber: block.number,
      guess,
      blockValue,
    };
  }
  
  private getRandomMiningSource(): string {
    // Randomly choose between Zero Address and Dead Address
    const sources = [ZERO_ADDRESS, DEAD_ADDRESS];
    return sources[Math.random() < 0.5 ? 0 : 1];
  }
  
  startAutoMining(guess: 0 | 1, intervalMs: number = 2000): void {
    if (this.miningInterval) return;
    
    this.isMining = true;
    this.miningInterval = setInterval(async () => {
      if (!this.isMining) return;
      
      try {
        const result = await this.mine(guess);
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('auto-mining-result', {
          detail: result
        }));
        
      } catch (error) {
        console.error('Auto mining failed:', error);
      }
    }, intervalMs);
  }
  
  stopAutoMining(): void {
    this.isMining = false;
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
  }
  
  getTotalMined(): number {
    return this.totalMined;
  }
  
  getSuccessfulMines(): number {
    return this.successfulMines;
  }
  
  getWinRate(): number {
    if (this.totalMined === 0) return 0;
    return this.successfulMines / (this.totalMined / 1);
  }
  
  isAutoMining(): boolean {
    return this.isMining;
  }
  
  async getMaxMiningLimit(): Promise<number> {
    const maxSupply = parseFloat(M_ETH_TOKEN.maxSupply);
    return maxSupply;
  }
  
  canMine(): boolean {
    return this.totalMined < parseFloat(M_ETH_TOKEN.maxSupply);
  }
}

export const miningService = MiningService.getInstance();
