// src/constant/tokens/M_ETH.ts

export const M_ETH_TOKEN = {
  address: '0x4d45544800000000000000000000000000000000',
  name: 'Mined ETH',
  symbol: 'M_ETH',
  decimals: 18,
  chainId: 8453, // Base Mainnet
  
  peggedTo: 'ETH',
  backingReserves: [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000dEaD',
  ],
  totalBackingETH: '18.390957519901445631',
  maxSupply: '18.390957519901445631', // Can't mine more than backing
  
  // MINING SETTINGS
  miningReward: '1', // 1 M_ETH per win (not 0.001)
  miningGuess: '0 or 1', // Pick 0 or 1
  miningWinRate: '50%',
};

export const M_ETH_BALANCE = '0';
