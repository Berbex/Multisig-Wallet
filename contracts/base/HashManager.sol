// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HashManager - Performs operations related to approving hashes
 * @dev This contract allows users to approve hashes, which can be used as a
 *      valid signature for a transaction
 */
abstract contract HashManager {
    /**
     * @notice Emitted when a hash is approved
     * @param hash The hash that was approved
     * @param owner The address of the owner who approved the hash
     */
    event HashApproved(bytes32 indexed hash, address indexed owner);

    /// @notice Mapping to keep track of all hashes (message or transaction) that have been approved by ANY owners
    mapping(address => mapping(bytes32 => bool)) public approvedHashes;

    /**
     * @notice Marks hash `hashToApprove` as approved
     * @dev This can be used with a pre-approved hash transaction signature
     *      IMPORTANT: The approved hash stays approved forever. There's no revocation mechanism, so it behaves similarly to ECDSA signatures
     * @param hashToApprove The hash to mark as approved for signatures that are verified by this contract
     */
    function approveHash(bytes32 hashToApprove) public virtual {
        approvedHashes[msg.sender][hashToApprove] = true;

        emit HashApproved(hashToApprove, msg.sender);
    }
}
