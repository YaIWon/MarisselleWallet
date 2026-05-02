// src/pages/GasAccount/utils/marisselleHub.ts
// ==============================================================
// CENTRAL HUB - ONE FILE TO RULE THEM ALL
// All addresses, networks, tokens go here
// ==============================================================

// ==============================================================
// 1. NETWORKS
// ==============================================================
export const NETWORKS = {
  BASE: { chainId: 8453, name: 'Base Mainnet', rpc: 'https://mainnet.base.org' },
  GANACHE: { chainId: 1337, name: 'Ganache', rpc: 'http://127.0.0.1:8545', isTemplate: true },
};

// ==============================================================
// 2. TOKEN ADDRESSES
// ==============================================================
export const TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDbC: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
  BTC_USD: '0x852aE0B1Af1aAeDB0fC4428B4B24420780976ca8',
  M_ETH: '0x4d45544800000000000000000000000000000000',
};

// ==============================================================
// 3. POOL ADDRESSES
// ==============================================================
export const POOLS = {
  WETH_ETH: '0x8436Cd266c10Fbe933d879346E162572997FC2EE',
  USDC_BASE: '0x1dcc3734dF1f23BC5DEb3634d9490d462cba5aED',
  BTC_USD_USDC: '0x852aE0B1Af1aAeDB0fC4428B4B24420780976ca8',
  USDbC_USDC: '0xd9aaeC86B65D86F6A7B5B1b0c42FFA531710b6cA',
  USDbC_ETH: '0x682985aD0a0aeF0dB97C4b9b32fA9999b3F9e97D',
};

// ==============================================================
// 4. CONSTANT ADDRESSES
// ==============================================================
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// ==============================================================
// 5. GANACHE (FILL AFTER STARTING GANACHE)
// ==============================================================
export const GANACHE = {
  walletAddress: 'GANACHE_WALLET_PLACEHOLDER',
  privateKey: 'GANACHE_KEY_PLACEHOLDER',
  mnemonic: 'GANACHE_MNEMONIC_PLACEHOLDER',
  isReady: false,
};

// ==============================================================
// 6. CROSS-CHAIN POOL (SAME ADDRESS ON BOTH CHAINS)
// ==============================================================
export const CROSS_CHAIN_POOL = {
  address: 'CROSS_CHAIN_POOL_PLACEHOLDER',
  isActive: false,
};

// ==============================================================
// 7. HELPER FUNCTIONS
// ==============================================================
export const getAllWhitelistedAddresses = (): string[] => {
  const addresses = [
    ...Object.values(POOLS),
    TOKENS.M_ETH,
    ZERO_ADDRESS,
    DEAD_ADDRESS,
  ];
  if (CROSS_CHAIN_POOL.address && !CROSS_CHAIN_POOL.address.includes('PLACEHOLDER')) {
    addresses.push(CROSS_CHAIN_POOL.address);
  }
  return addresses;
};

export const isGanacheReady = (): boolean => {
  return !GANACHE.walletAddress.includes('PLACEHOLDER');
};
