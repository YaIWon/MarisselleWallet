// src/constant/miningPools/M_ETH.ts

import { ZERO_ADDRESS, DEAD_ADDRESS } from '@/constant';
import { M_ETH_TOKEN } from '@/constant/tokens/M_ETH';

// POOL A1: M_ETH ↔ ETH (1:1) - Using Zero Address as backing
export const POOL_A1 = {
  id: 'pool_a1',
  name: 'Pool A1 (1:1) - Zero Address',
  tokenA: M_ETH_TOKEN,
  tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
  ratio: 1,
  backingAddress: ZERO_ADDRESS,
  backingBalance: '14.059751193673341987',
  type: 'LIQUIDITY_POOL',
  status: 'active',
};

// POOL A2: M_ETH ↔ ETH (1:1) - Using Dead Address as backing
export const POOL_A2 = {
  id: 'pool_a2',
  name: 'Pool A2 (1:1) - Dead Address',
  tokenA: M_ETH_TOKEN,
  tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
  ratio: 1,
  backingAddress: DEAD_ADDRESS,
  backingBalance: '4.331206326228103644',
  type: 'LIQUIDITY_POOL',
  status: 'active',
};

// POOL B1: M_ETH ↔ ETH (1:50) - Zero Address High Yield
export const POOL_B1 = {
  id: 'pool_b1',
  name: 'Pool B1 (1:50) - Zero Address High Yield',
  tokenA: M_ETH_TOKEN,
  tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
  ratio: 50,
  backingAddress: ZERO_ADDRESS,
  backingBalance: '14.059751193673341987',
  type: 'LIQUIDITY_POOL',
  status: 'active',
  apy: 125,
};

// POOL B2: M_ETH ↔ ETH (1:50) - Dead Address High Yield
export const POOL_B2 = {
  id: 'pool_b2',
  name: 'Pool B2 (1:50) - Dead Address High Yield',
  tokenA: M_ETH_TOKEN,
  tokenB: { symbol: 'ETH', address: 'native', decimals: 18 },
  ratio: 50,
  backingAddress: DEAD_ADDRESS,
  backingBalance: '4.331206326228103644',
  type: 'LIQUIDITY_POOL',
  status: 'active',
  apy: 250,
};

export const ALL_M_ETH_POOLS = [POOL_A1, POOL_A2, POOL_B1, POOL_B2];
