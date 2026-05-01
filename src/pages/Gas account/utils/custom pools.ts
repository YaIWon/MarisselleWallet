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
    tokenA: { symbol: 'BTC.USD', address: '0x852aE0B1Af1aAeDB0fC4428B4B24420780976ca8', decimals: 18 },
    tokenB: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ratio: 60000,
    chainId: 8453,
    type: 'synthetic-pool',
  },
  
  // USDbC / USDC pool (stablecoin pool)
  USDbC_USDC: {
    poolAddress: '0xd9aaeC86B65D86F6A7B5B1b0c42FFA531710b6cA',
    tokenA: { symbol: 'USDbC', address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', decimals: 6 },
    tokenB: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ratio: 1,
    chainId: 8453,
    type: 'stable-pool',
  },
  
  // USDbC / ETH pool
  USDbC_ETH: {
    poolAddress: '0x682985aD0a0aeF0dB97C4b9b32fA9999b3F9e97D',
    tokenA: { symbol: 'USDbC', address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', decimals: 6 },
    tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
    ratio: 0.00033,
    chainId: 8453,
    type: 'stable-pool',
  },

  // ==============================================================
  // CROSS-CHAIN POOL (Ganache ↔ Base Mainnet)
  // TEMPLATE - Ganache details to be filled after Ganache starts
  // ==============================================================
  CROSS_CHAIN: {
    poolAddress: 'CROSS_CHAIN_POOL_ADDRESS_PLACEHOLDER',  // ← Same on both chains via CREATE2
    tokenA: { 
      symbol: 'gETH', 
      address: 'GANACHE_ADDRESS_PLACEHOLDER',  // ← Ganache ETH (native)
      decimals: 18,
      isGanache: true,
    },
    tokenB: { 
      symbol: 'ETH', 
      address: 'native', 
      decimals: 18,
      isBase: true,
    },
    ratio: 1,  // 1 Ganache ETH = 1 Base ETH
    chainId: 8453,
    type: 'cross-chain-pool',
    isTemplate: true,
    ganacheChainId: 1337,
    ganacheRpc: 'http://127.0.0.1:8545',
    // These will be filled after deployment
    ganachePoolAddress: 'GANACHE_POOL_ADDRESS_PLACEHOLDER',
    ganacheContractAddress: 'GANACHE_CONTRACT_PLACEHOLDER',
    ganachePrivateKey: 'GANACHE_PRIVATE_KEY_PLACEHOLDER',
    ganacheAddress: 'GANACHE_ADDRESS_PLACEHOLDER',
    status: 'template',  // 'template' or 'active'
  },
};

// Helper to check if cross-chain pool is ready
export const isCrossChainPoolReady = () => {
  const pool = CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN;
  return !pool.poolAddress.includes('PLACEHOLDER') && pool.status === 'active';
};

// Helper to get cross-chain pool config
export const getCrossChainPoolConfig = () => {
  return CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN;
};

// Helper to update cross-chain pool with real Ganache addresses (called after deployment)
export const updateCrossChainPoolAddresses = (
  poolAddress: string,
  ganacheAddress: string,
  ganachePrivateKey: string,
  ganacheWalletAddress: string
) => {
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.poolAddress = poolAddress;
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.ganachePoolAddress = poolAddress;
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.ganacheContractAddress = poolAddress;
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.tokenA.address = ganacheAddress;
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.ganachePrivateKey = ganachePrivateKey;
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.ganacheAddress = ganacheWalletAddress;
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.status = 'active';
  CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN.isTemplate = false;
  
  console.log('Cross-chain pool updated with real addresses');
  console.log('Pool Address:', poolAddress);
  console.log('Ganache Address:', ganacheAddress);
};

export const getTokenPrice = (tokenSymbol: string, overridePrice?: number) => {
  if (overridePrice) return overridePrice;
  
  switch (tokenSymbol) {
    case 'ETH': return 3000;
    case 'WETH': return 3000;
    case 'USDC': return 1;
    case 'USDbC': return 1;
    case 'BASE': return 3000;
    case 'BTC.USD': return 60000;
    case 'gETH': return 3000;  // Pegged to ETH
    default: return 0;
  }
};

export const getPoolByAddress = (address: string) => {
  return Object.values(CUSTOM_LIQUIDITY_POOLS).find(
    pool => pool.poolAddress.toLowerCase() === address.toLowerCase()
  );
};

export const getAllPoolAddresses = () => {
  return Object.values(CUSTOM_LIQUIDITY_POOLS)
    .filter(pool => !pool.poolAddress.includes('PLACEHOLDER'))
    .map(pool => pool.poolAddress);
};

export const getActivePools = () => {
  return Object.values(CUSTOM_LIQUIDITY_POOLS).filter(
    pool => !pool.poolAddress.includes('PLACEHOLDER')
  );
};

export const getCrossChainPool = () => {
  return CUSTOM_LIQUIDITY_POOLS.CROSS_CHAIN;
};
