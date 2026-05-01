// src/pages/GasAccount/utils/crossChainPool.template.ts

export const CROSS_CHAIN_POOL_TEMPLATE = {
  // GANACHE DETAILS - TO BE FILLED AFTER GANACHE STARTS
  ganache: {
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    poolAddress: 'GANACHE_POOL_ADDRESS_PLACEHOLDER',  // ← Fill after deploy
    contractAddress: 'GANACHE_CONTRACT_PLACEHOLDER', // ← Fill after deploy
    privateKey: 'GANACHE_PRIVATE_KEY_PLACEHOLDER',   // ← Fill after deploy
    address: 'GANACHE_ADDRESS_PLACEHOLDER',          // ← Fill after deploy
  },
  
  // BASE MAINNET DETAILS (KNOWN, FIXED)
  base: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    poolAddress: 'SAME_AS_GANACHE_POOL_ADDRESS',     // CREATE2 = same address
    contractAddress: 'SAME_AS_GANACHE_CONTRACT',
  },
  
  // POOL SETTINGS
  ratio: 1,  // 1 Ganache ETH = 1 Base ETH
  type: 'cross-chain-pool',
  status: 'template',  // Not active until filled
};

// Helper to check if template is ready
export const isCrossChainPoolReady = () => {
  return !CROSS_CHAIN_POOL_TEMPLATE.ganache.poolAddress.includes('PLACEHOLDER');
};
