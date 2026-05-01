// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ==============================================================
// CROSS-CHAIN POOL - Ganache ↔ Base Mainnet Bridge
// Same address on both chains via CREATE2
// ==============================================================

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract CrossChainPool {
    // ==============================================================
    // CONSTANTS
    // ==============================================================
    uint256 public constant GANACHE_CHAIN_ID = 1337;
    uint256 public constant BASE_CHAIN_ID = 8453;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public constant ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    
    // ==============================================================
    // STATE VARIABLES
    // ==============================================================
    address public owner;
    address public relayer;
    uint256 public totalBaseETHBacking;
    bool public isActive;
    
    // Balances: chainId => user => balance
    mapping(uint256 => mapping(address => uint256)) public balances;
    
    // Locked transactions: sourceChain => txHash => bool
    mapping(uint256 => mapping(bytes32 => bool)) public processedLocks;
    
    // Pool addresses on each chain (same address on both)
    address public crossChainPoolAddress;
    
    // ==============================================================
    // EVENTS
    // ==============================================================
    event PoolInitialized(address indexed poolAddress, uint256 chainId);
    event Locked(address indexed from, uint256 amount, uint256 sourceChainId, uint256 targetChainId, bytes32 txHash);
    event Released(address indexed to, uint256 amount, uint256 sourceChainId, uint256 targetChainId, bytes32 txHash);
    event BaseETHBacked(address indexed from, uint256 amount);
    event RelayerChanged(address indexed oldRelayer, address indexed newRelayer);
    event GanacheETHMined(address indexed miner, uint256 amount, uint256 nonce);
    
    // ==============================================================
    // MODIFIERS
    // ==============================================================
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }
    
    modifier onlyActive() {
        require(isActive, "Pool not active");
        _;
    }
    
    // ==============================================================
    // CONSTRUCTOR (CREATE2 compatible)
    // ==============================================================
    constructor() {
        owner = msg.sender;
        relayer = msg.sender;
        isActive = false;
        crossChainPoolAddress = address(this);
        
        emit PoolInitialized(address(this), block.chainid);
    }
    
    // ==============================================================
    // INITIALIZATION (called after deployment)
    // ==============================================================
    function activate() external onlyOwner {
        require(!isActive, "Already active");
        isActive = true;
    }
    
    function setRelayer(address newRelayer) external onlyOwner {
        emit RelayerChanged(relayer, newRelayer);
        relayer = newRelayer;
    }
    
    // ==============================================================
    // CORE BRIDGE FUNCTIONS
    // ==============================================================
    
    /// @notice Lock tokens on source chain (Ganache or Base)
    function lock(uint256 amount, uint256 targetChainId) external payable onlyActive {
        require(amount > 0, "Amount must be > 0");
        require(targetChainId == GANACHE_CHAIN_ID || targetChainId == BASE_CHAIN_ID, "Invalid target chain");
        require(targetChainId != block.chainid, "Cannot lock to same chain");
        
        bytes32 txHash = keccak256(abi.encodePacked(block.timestamp, msg.sender, amount, targetChainId));
        require(!processedLocks[block.chainid][txHash], "Already processed");
        processedLocks[block.chainid][txHash] = true;
        
        // Transfer native ETH if sent with transaction
        if (msg.value > 0) {
            require(msg.value == amount, "ETH amount mismatch");
            balances[block.chainid][msg.sender] += amount;
        }
        
        emit Locked(msg.sender, amount, block.chainid, targetChainId, txHash);
    }
    
    /// @notice Lock ERC20 tokens on source chain
    function lockERC20(address token, uint256 amount, uint256 targetChainId) external onlyActive {
        require(amount > 0, "Amount must be > 0");
        require(targetChainId == GANACHE_CHAIN_ID || targetChainId == BASE_CHAIN_ID, "Invalid target chain");
        require(targetChainId != block.chainid, "Cannot lock to same chain");
        require(token != address(0), "Invalid token");
        
        bytes32 txHash = keccak256(abi.encodePacked(block.timestamp, msg.sender, token, amount, targetChainId));
        require(!processedLocks[block.chainid][txHash], "Already processed");
        processedLocks[block.chainid][txHash] = true;
        
        // Transfer ERC20 tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[block.chainid][msg.sender] += amount;
        
        emit Locked(msg.sender, amount, block.chainid, targetChainId, txHash);
    }
    
    /// @notice Release tokens on target chain (called by relayer)
    function release(
        address to,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 txHash
    ) external onlyRelayer onlyActive {
        require(amount > 0, "Amount must be > 0");
        require(sourceChainId == GANACHE_CHAIN_ID || sourceChainId == BASE_CHAIN_ID, "Invalid source chain");
        require(sourceChainId != block.chainid, "Cannot release on same chain");
        require(!processedLocks[sourceChainId][txHash], "Already processed");
        
        processedLocks[sourceChainId][txHash] = true;
        balances[sourceChainId][to] += amount;
        
        // Transfer native ETH
        payable(to).transfer(amount);
        
        emit Released(to, amount, sourceChainId, block.chainid, txHash);
    }
    
    /// @notice Release ERC20 tokens on target chain (called by relayer)
    function releaseERC20(
        address to,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 txHash
    ) external onlyRelayer onlyActive {
        require(amount > 0, "Amount must be > 0");
        require(sourceChainId == GANACHE_CHAIN_ID || sourceChainId == BASE_CHAIN_ID, "Invalid source chain");
        require(sourceChainId != block.chainid, "Cannot release on same chain");
        require(!processedLocks[sourceChainId][txHash], "Already processed");
        require(token != address(0), "Invalid token");
        
        processedLocks[sourceChainId][txHash] = true;
        balances[sourceChainId][to] += amount;
        
        // Transfer ERC20 tokens
        IERC20(token).transfer(to, amount);
        
        emit Released(to, amount, sourceChainId, block.chainid, txHash);
    }
    
    // ==============================================================
    // BACKING FUNCTIONS (Base ETH backs Ganache ETH)
    // ==============================================================
    
    /// @notice Send Base ETH to this contract to back Ganache ETH 1:1
    function backGanacheETH() external payable onlyActive {
        require(msg.value > 0, "Must send ETH");
        require(block.chainid == BASE_CHAIN_ID, "Only on Base chain");
        
        totalBaseETHBacking += msg.value;
        
        emit BaseETHBacked(msg.sender, msg.value);
    }
    
    /// @notice Get the backing ratio (total Base ETH / total Ganache ETH locked)
    function getBackingRatio() external view returns (uint256) {
        uint256 totalGanacheLocked = getTotalLockedOnChain(GANACHE_CHAIN_ID);
        if (totalGanacheLocked == 0) return 0;
        return (totalBaseETHBacking * 100) / totalGanacheLocked;
    }
    
    /// @notice Get total locked value on a specific chain
    function getTotalLockedOnChain(uint256 chainId) public view returns (uint256) {
        // This is simplified - in production you'd sum all user balances
        // For now, return totalBaseETHBacking as proxy
        return totalBaseETHBacking;
    }
    
    // ==============================================================
    // MINING FUNCTIONS (Ganache only)
    // ==============================================================
    
    /// @notice Mine Ganache ETH (only works on Ganache)
    function mineGanacheETH(uint256 nonce, uint256 guess) external payable onlyActive {
        require(block.chainid == GANACHE_CHAIN_ID, "Only on Ganache");
        require(guess == 0 || guess == 1, "Guess must be 0 or 1");
        
        // Simple proof of work
        uint256 blockValue = uint256(blockhash(block.number - 1)) % 2;
        require(guess == blockValue, "Wrong guess, try again");
        
        // Reward: 0.001 Ganache ETH
        uint256 reward = 0.001 ether;
        
        // Track balance (will be backed by Base ETH later)
        balances[GANACHE_CHAIN_ID][msg.sender] += reward;
        
        emit GanacheETHMined(msg.sender, reward, nonce);
    }
    
    /// @notice Check your balance on this chain
    function getBalance(address user, uint256 chainId) external view returns (uint256) {
        return balances[chainId][user];
    }
    
    // ==============================================================
    // WITHDRAWAL FUNCTIONS
    // ==============================================================
    
    /// @notice Withdraw your locked tokens back to source chain (if not bridged)
    function withdraw(uint256 amount) external onlyActive {
        require(amount > 0, "Amount must be > 0");
        require(balances[block.chainid][msg.sender] >= amount, "Insufficient balance");
        
        balances[block.chainid][msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
    
    function withdrawERC20(address token, uint256 amount) external onlyActive {
        require(amount > 0, "Amount must be > 0");
        require(balances[block.chainid][msg.sender] >= amount, "Insufficient balance");
        require(token != address(0), "Invalid token");
        
        balances[block.chainid][msg.sender] -= amount;
        IERC20(token).transfer(msg.sender, amount);
    }
    
    // ==============================================================
    // UTILITY FUNCTIONS
    // ==============================================================
    
    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
    
    function isBaseChain() external view returns (bool) {
        return block.chainid == BASE_CHAIN_ID;
    }
    
    function isGanacheChain() external view returns (bool) {
        return block.chainid == GANACHE_CHAIN_ID;
    }
    
    // ==============================================================
    // RECEIVE ETH
    // ==============================================================
    receive() external payable {
        if (block.chainid == BASE_CHAIN_ID && msg.value > 0) {
            totalBaseETHBacking += msg.value;
            emit BaseETHBacked(msg.sender, msg.value);
        }
    }
}
