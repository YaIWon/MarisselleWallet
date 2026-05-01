import { isSameAddress } from '@/background/utils';
import { CHAINS_ENUM, CHAINS } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import {
  decodeCalldata,
  QuoteResult,
  DecodeCalldataResult,
} from '@rabby-wallet/rabby-swap/dist/quote';
import { useMemo } from 'react';
import { getRouter, getSpender, isSwapWrapToken } from './quote';
import BigNumber from 'bignumber.js';
import { findChain, findChainByEnum } from '@/utils/chain';
import { CUSTOM_LIQUIDITY_POOLS } from '@/pages/GasAccount/utils/customPools';

type ValidateTokenParam = {
  id: string;
  symbol: string;
  decimals: number;
};

// Helper to check if this is a custom pool quote
const isCustomPoolQuote = (dexId: DEX_ENUM, payTokenId?: string, receiveTokenId?: string): boolean => {
  if (dexId === DEX_ENUM.WRAPTOKEN) return false;
  
  // Check if this pair exists in custom pools
  return Object.values(CUSTOM_LIQUIDITY_POOLS).some(pool => 
    (pool.tokenA.address === payTokenId && pool.tokenB.address === receiveTokenId) ||
    (pool.tokenA.address === receiveTokenId && pool.tokenB.address === payTokenId)
  );
};

// NEW: Get custom pool router address
export const getCustomPoolRouter = (dexId: DEX_ENUM, payTokenId?: string, receiveTokenId?: string): string | undefined => {
  if (!isCustomPoolQuote(dexId, payTokenId, receiveTokenId)) return undefined;
  
  const pool = Object.values(CUSTOM_LIQUIDITY_POOLS).find(
    p => (p.tokenA.address === payTokenId && p.tokenB.address === receiveTokenId) ||
         (p.tokenA.address === receiveTokenId && p.tokenB.address === payTokenId)
  );
  
  return pool?.poolAddress;
};

// NEW: Get custom pool spender
export const getCustomPoolSpender = (dexId: DEX_ENUM, payTokenId?: string, receiveTokenId?: string): string => {
  return getCustomPoolRouter(dexId, payTokenId, receiveTokenId) || '';
};

// NEW: Get custom pool fee (always 0)
export const getCustomPoolFee = (dexId: DEX_ENUM, payTokenId?: string, receiveTokenId?: string): string => {
  if (isCustomPoolQuote(dexId, payTokenId, receiveTokenId)) {
    return '0';
  }
  return '0.25';
};

// NEW: Check if custom pool needs approval (never)
export const needsCustomPoolApproval = (dexId: DEX_ENUM, payTokenId?: string, receiveTokenId?: string): boolean => {
  return !isCustomPoolQuote(dexId, payTokenId, receiveTokenId);
};

export const verifyRouterAndSpender = (
  chain: CHAINS_ENUM,
  dexId: DEX_ENUM,
  router?: string,
  spender?: string,
  payTokenId?: string,
  receiveTokenId?: string
) => {
  // MODIFIED: Bypass verification for custom pools
  if (isCustomPoolQuote(dexId, payTokenId, receiveTokenId)) {
    return [true, true];
  }
  
  if (dexId === DEX_ENUM.WRAPTOKEN) {
    return [true, true];
  }
  if (!dexId || !router || !spender || !payTokenId || !receiveTokenId) {
    return [true, true];
  }
  const routerWhitelist = getRouter(dexId, chain, payTokenId);
  const spenderWhitelist = getSpender(dexId, chain);
  const isNativeToken = isSameAddress(
    payTokenId,
    findChainByEnum(chain)!.nativeTokenAddress
  );
  const isWrapTokens = isSwapWrapToken(payTokenId, receiveTokenId, chain);

  return [
    isSameAddress(routerWhitelist, router),
    isNativeToken || isWrapTokens
      ? true
      : isSameAddress(spenderWhitelist, spender),
  ];
};

const isNativeToken = (chain: CHAINS_ENUM, tokenId: string) =>
  isSameAddress(tokenId, findChainByEnum(chain)!.nativeTokenAddress);

export const verifyCalldata = <T extends Parameters<typeof decodeCalldata>[1]>(
  data: QuoteResult | null,
  dexId: DEX_ENUM | null,
  slippage: string | number,
  tx?: T
) => {
  // MODIFIED: Skip calldata verification for custom pools
  if (dexId && isCustomPoolQuote(dexId, data?.fromToken, data?.toToken)) {
    return true;
  }
  
  let callDataResult: DecodeCalldataResult | null = null;
  if (dexId && dexId !== DEX_ENUM.WRAPTOKEN && tx) {
    try {
      callDataResult = decodeCalldata(dexId, tx) as DecodeCalldataResult;
    } catch (error) {
      callDataResult = null;
    }
  }

  let result = true;
  if (slippage && callDataResult && data && tx) {
    const estimateMinReceive = new BigNumber(data.toTokenAmount).times(
      new BigNumber(1).minus(slippage)
    );
    const chain = findChain({
      id: tx.chainId,
    });

    if (!chain) {
      result = true;
    } else {
      result =
        ((dexId === DEX_ENUM['UNISWAP'] &&
          isNativeToken(chain.enum, data.fromToken)) ||
          isSameAddress(callDataResult.fromToken, data.fromToken)) &&
        callDataResult.fromTokenAmount === data.fromTokenAmount &&
        isSameAddress(callDataResult.toToken, data.toToken) &&
        new BigNumber(callDataResult.minReceiveToTokenAmount)
          .minus(estimateMinReceive)
          .div(estimateMinReceive)
          .abs()
          .lte(0.05);
    }
  }
  return result;
};

type VerifySdkParams<T extends ValidateTokenParam> = {
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
  slippage: string | number;
  data: QuoteResult | null;
  payToken: T;
  receiveToken: T;
};

export const verifySdk = <T extends ValidateTokenParam>(
  p: VerifySdkParams<T>
) => {
  const { chain, dexId, slippage, data, payToken, receiveToken } = p;

  const isWrapTokens = isSwapWrapToken(payToken.id, receiveToken.id, chain);
  const actualDexId = isWrapTokens ? DEX_ENUM.WRAPTOKEN : dexId;
  
  // MODIFIED: Always pass for custom pools
  if (isCustomPoolQuote(actualDexId, payToken?.id, receiveToken?.id)) {
    return {
      isSdkDataPass: true,
    };
  }

  const [routerPass, spenderPass] = verifyRouterAndSpender(
    chain,
    actualDexId,
    data?.tx?.to,
    data?.spender,
    payToken?.id,
    receiveToken?.id
  );

  const callDataPass = verifyCalldata(
    data,
    actualDexId,
    new BigNumber(slippage).div(100).toFixed(),
    data?.tx ? { ...data?.tx, chainId: findChainByEnum(chain)!.id } : undefined
  );

  return {
    isSdkDataPass: routerPass && spenderPass && callDataPass,
  };
};
