// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HashManager - Performs operations related to hashing
 */
abstract contract HashManager {
    event HashApproved(bytes32 indexed hash, address indexed owner);

    // User to data hash mapping
    mapping(address => mapping(bytes32 => bool)) public approvedHashes;

    function approveHash(bytes32 hashToApprove) external virtual {
        approvedHashes[msg.sender][hashToApprove] = true;

        emit HashApproved(hashToApprove, msg.sender);
    }
}
