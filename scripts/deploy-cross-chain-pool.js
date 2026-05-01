const { ethers } = require("ethers");

// Same salt for both chains = same address
const SALT = "0x0000000000000000000000000000000000000000000000000000000000000001";

async function main() {
  // Deploy on Ganache
  const ganacheProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const ganacheWallet = new ethers.Wallet("0x...", ganacheProvider); // Ganache private key
  
  const factory = new ethers.ContractFactory(
    CrossChainPool.abi,
    CrossChainPool.bytecode,
    ganacheWallet
  );
  
  const ganachePool = await factory.deploy();
  await ganachePool.waitForDeployment();
  const ganacheAddress = await ganachePool.getAddress();
  console.log("Ganache Pool:", ganacheAddress);
  
  // Deploy on Base using CREATE2 with SAME SALT
  const baseProvider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const baseWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, baseProvider);
  
  const basePool = await factory.deploy({
    salt: SALT
  });
  await basePool.waitForDeployment();
  const baseAddress = await basePool.getAddress();
  console.log("Base Pool:", baseAddress);
  
  console.log("Same address?", ganacheAddress === baseAddress);
}

main();
