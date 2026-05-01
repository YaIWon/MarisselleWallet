#!/bin/bash
# scripts/setup-cross-chain-pool.sh

echo "Step 1: Starting Ganache..."
ganache-cli --deterministic --chainId 1337 > ganache_output.txt &
GANACHE_PID=$!
sleep 3

echo "Step 2: Getting Ganache addresses..."
GANACHE_ADDRESS=$(head -n 10 ganache_output.txt | grep "Account 0" | head -1 | awk '{print $NF}')
GANACHE_PRIVATE_KEY=$(head -n 10 ganache_output.txt | grep "Private Key" | head -1 | awk '{print $NF}')

echo "Ganache Address: $GANACHE_ADDRESS"

echo "Step 3: Deploy cross-chain pool to Ganache..."
GANACHE_POOL_ADDRESS=$(forge create --rpc-url http://127.0.0.1:8545 --private-key $GANACHE_PRIVATE_KEY src/contracts/CrossChainPool.sol:CrossChainPool | grep "Deployed to" | awk '{print $NF}')

echo "Pool deployed at: $GANACHE_POOL_ADDRESS"

echo "Step 4: Updating template with real addresses..."
sed -i "s/GANACHE_POOL_ADDRESS_PLACEHOLDER/$GANACHE_POOL_ADDRESS/g" src/pages/GasAccount/utils/crossChainPool.template.ts
sed -i "s/GANACHE_CONTRACT_PLACEHOLDER/$GANACHE_POOL_ADDRESS/g" src/pages/GasAccount/utils/crossChainPool.template.ts
sed -i "s/GANACHE_PRIVATE_KEY_PLACEHOLDER/$GANACHE_PRIVATE_KEY/g" src/pages/GasAccount/utils/crossChainPool.template.ts
sed -i "s/GANACHE_ADDRESS_PLACEHOLDER/$GANACHE_ADDRESS/g" src/pages/GasAccount/utils/crossChainPool.template.ts

echo "Step 5: Rebuilding wallet with real cross-chain pool..."
npm run build

echo "Done! Cross-chain pool is REAL."
