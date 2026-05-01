// Custom liquidity pools for Gas Account
// All addresses are REAL on Base Mainnet

export const CUSTOM_LIQUIDITY_POOLS = {
  // WETH / ETH pool
  WETH_ETH: {
    poolAddress: '0x8436Cd266c10Fbe933d879346E162572997FC2EE',
    tokenA: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
    ratio: 1,
    chainId: 8453,
    type: 'gas-pool',
  },
  
  // USDC / BASE pool
  USDC_BASE: {
    poolAddress: '0x1dcc3734dF1f23BC5DEb3634d9490d462cba5aED',
    tokenA: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    tokenB: { symbol: 'BASE', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    ratio: 0.00033,
    chainId: 8453,
    type: 'stable-pool',
  },
  
  // BTC.USD / USDC pool
  BTC_USD_USDC: {
    poolAddress: '0x852aE0B1Af1aAeDB0fC4428B4B24420780976ca8',
    tokenA: { symbol: 'BTC.USD', address: '0x852aE0B1Af1aAeDB0fC4428B4B24420780976ca8', decimals: 18, isSynthetic: true },
    tokenB: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ratio: 60000,
    chainId: 8453,
    type: 'synthetic-pool',
  },
  
  // USDbC / USDC pool (stablecoin pool)
  USDbC_USDC: {
    poolAddress: '0xd9aaeC86B65D86F6A7B5B1b0c42FFA531710b6cA',
    tokenA: { symbol: 'USDbC', address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', decimals: 6, isStablecoin: true },
    tokenB: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ratio: 1,
    chainId: 8453,
    type: 'stable-pool',
  },
  
  // USDbC / ETH pool (REAL address from you)
  USDbC_ETH: {
    poolAddress: '0x682985aD0a0aeF0dB97C4b9b32fA9999b3F9e97D',
    tokenA: { symbol: 'USDbC', address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', decimals: 6 },
    tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
    ratio: 0.00033,
    chainId: 8453,
    type: 'stable-pool',
  },
  
  // USDbC / BTC.BR pool (PancakeSwap)
  USDbC_BTCBR: {
    poolAddress: '0xA9f77C1CF1821749d192699122B879698bC79e7e',
    tokenA: { symbol: 'USDbC', address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', decimals: 6 },
    tokenB: { symbol: 'BTCBR', address: '0x...', decimals: 18 }, // BTCBR token on Base
    ratio: 100,
    chainId: 8453,
    type: 'custom-pool',
  },
  
  // M_ETH / ETH (HARDCODED - will work when you create the pool)
  M_ETH_ETH: {
    poolAddress: '0x0000000000000000000000000000000000000000', // Will be set when pool created
    tokenA: { symbol: 'M_ETH', address: '0x4d45544800000000000000000000000000000000', decimals: 18 },
    tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
    ratio: 1,
    chainId: 8453,
    type: 'mining-pool',
    isHardcoded: true, // Flag to indicate this is hardcoded
  },
};

// Helper functions
export const getPoolByAddress = (address: string) => {
  return Object.values(CUSTOM_LIQUIDITY_POOLS).find(
    pool => pool.poolAddress.toLowerCase() === address.toLowerCase()
  );
};

export const getPoolsByType = (type: string) => {
  return Object.values(CUSTOM_LIQUIDITY_POOLS).filter(
    pool => pool.type === type
  );
};

export const getAllPoolAddresses = () => {
  return Object.values(CUSTOM_LIQUIDITY_POOLS)
    .filter(pool => pool.poolAddress !== '0x0000000000000000000000000000000000000000')
    .map(pool => pool.poolAddress);
};

export const getTokenPrice = (tokenSymbol: string, overridePrice?: number) => {
  if (overridePrice) return overridePrice;
  
  switch (tokenSymbol) {
    case 'ETH': return 3000;
    case 'WETH': return 3000;
    case 'USDC': return 1;
    case 'USDbC': return 1;
    case 'BASE': return 3000;
    case 'M_ETH': return 3000;
    case 'BTC.USD': return 60000;
    case 'BTCBR': return 60000;
    default: return 0;
  }
};

// Get pool ratio (can be overridden by oracle later)
export const getPoolRatio = (poolType: string, fromToken: string, toToken: string) => {
  const pool = Object.values(CUSTOM_LIQUIDITY_POOLS).find(
    p => (p.tokenA.symbol === fromToken && p.tokenB.symbol === toToken) ||
         (p.tokenA.symbol === toToken && p.tokenB.symbol === fromToken)
  );
  
  if (pool) {
    return pool.ratio;
  }
  
  return null;
};
