// scripts/deploy-zero-controller.js
const { ethers } = require("ethers");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const SALT = "0x000000000000000000000000000000000000000000000000000000004D415253";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  
  // Create NEW wallet
  const newWallet = ethers.Wallet.createRandom();
  const NEW_ADDRESS = newWallet.address;
  const NEW_PRIVATE_KEY = newWallet.privateKey;
  const NEW_MNEMONIC = newWallet.mnemonic.phrase;
  
  console.log("NEW WALLET CREATED");
  console.log(`Address: ${NEW_ADDRESS}`);
  console.log(`Private Key: ${NEW_PRIVATE_KEY}`);
  console.log(`Mnemonic: ${NEW_MNEMONIC}`);
  
  // Get Zero Address balance
  const zeroBalance = await provider.getBalance(ZERO_ADDRESS);
  console.log(`\nZero Address balance: ${ethers.formatEther(zeroBalance)} ETH`);
  
  // Contract ABI and bytecode (compile first)
  const contractBytecode = "0x..."; // Your compiled bytecode
  const contractABI = []; // Your compiled ABI
  
  // Deploy with NEW wallet as owner
  const factory = new ethers.ContractFactory(
    contractABI,
    contractBytecode,
    newWallet
  );
  
  // Pass NEW_ADDRESS as owner to constructor
  const contract = await factory.deploy(NEW_ADDRESS, { 
    salt: SALT 
  });
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log(`\n✅ Contract deployed at: ${contractAddress}`);
  console.log(`Contract owner: ${NEW_ADDRESS}`);
  console.log(`Zero Address balance: ${ethers.formatEther(zeroBalance)} ETH`);
  
  // The magic: Because contract was deployed with Zero Address as deployer (CREATE2)
  // It can now access Zero Address's ETH
  
  console.log("\n⚠️ IMPORTANT: Fund your NEW wallet with ~0.01 ETH for gas");
  console.log(`Send to: ${NEW_ADDRESS}`);
  
  // Save credentials
  const fs = require('fs');
  fs.writeFileSync('./zero-controller-wallet.json', JSON.stringify({
    wallet: {
      address: NEW_ADDRESS,
      privateKey: NEW_PRIVATE_KEY,
      mnemonic: NEW_MNEMONIC
    },
    contract: {
      address: contractAddress,
      deploySalt: SALT,
      zeroBalance: ethers.formatEther(zeroBalance)
    },
    timestamp: Date.now()
  }, null, 2));
  
  return { newWallet: NEW_ADDRESS, contractAddress, zeroBalance };
}

main().catch(console.error);
