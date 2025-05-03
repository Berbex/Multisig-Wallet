// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SelfAuthorized - Authorizes current contract to perform actions to itself
 */
abstract contract SelfAuthorized {
    // Error codes
    error NotAuthorized();

    /// @dev Modifier to restrict access to the contract itself
    modifier authorized() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }
}
