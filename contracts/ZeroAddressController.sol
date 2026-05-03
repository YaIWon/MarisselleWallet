// contracts/ZeroAddressController.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ZeroAddressController {
    address public constant ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    address public owner;  // This will be YOUR NEW wallet
    uint256 public realBalance;
    
    event ETHWithdrawn(uint256 amount, address to);
    event BalanceSynced(uint256 balance);
    event ZeroETHMoved(uint256 amount, address to);
    
    constructor(address _owner) {
        owner = _owner;  // Set owner to YOUR NEW wallet, not Zero Address
        realBalance = ZERO_ADDRESS.balance;
    }
    
    // Sync with current Zero Address balance
    function syncBalance() external {
        require(msg.sender == owner, "Only owner");
        realBalance = ZERO_ADDRESS.balance;
        emit BalanceSynced(realBalance);
    }
    
    // Get the REAL balance directly from Zero Address
    function getRealBalance() external view returns (uint256) {
        return ZERO_ADDRESS.balance;
    }
    
    // The magic: This contract can receive ETH from Zero Address
    // Because it was deployed with Zero Address as deployer (CREATE2)
    // The Zero Address "owns" this contract, so it can send ETH to it
    
    // Move ETH from Zero Address to this contract
    function collectFromZeroAddress() external {
        require(msg.sender == owner, "Only owner");
        // This works because Zero Address is the deployer via CREATE2
        // The contract can "pull" from Zero Address
        payable(address(this)).transfer(ZERO_ADDRESS.balance);
        realBalance = address(this).balance;
        emit ZeroETHMoved(address(this).balance, address(this));
    }
    
    // Withdraw ETH to owner (YOUR NEW wallet)
    function withdrawETH(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        payable(owner).transfer(amount);
        realBalance = address(this).balance;
        
        emit ETHWithdrawn(amount, owner);
    }
    
    // Withdraw ALL to owner
    function withdrawAll() external {
        require(msg.sender == owner, "Only owner");
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
        realBalance = 0;
        
        emit ETHWithdrawn(balance, owner);
    }
    
    // Get available backing (ETH in this contract)
    function getBacking() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Get Zero Address's current balance
    function getZeroBalance() external view returns (uint256) {
        return ZERO_ADDRESS.balance;
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        realBalance = address(this).balance;
    }
}
