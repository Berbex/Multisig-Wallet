// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DelegateCallVerifier {
    address public caller;

    /**
     * @notice This function is called to verify the delegate call
     * @dev It sets the caller address to the address of the contract that called this function
     */
    function verifyDelegateCall(address contractAddress) external {
        // If this contract is called directly, the caller will be the address of this contract
        // If this contract is called via delegatecall, the caller will be the address of the contract that called this function
        DelegateCallVerifier(contractAddress).setCaller();
    }

    function setCaller() external {
        caller = msg.sender;
    }
}
