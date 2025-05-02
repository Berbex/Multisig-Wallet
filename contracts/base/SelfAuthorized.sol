// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SelfAuthorized - Authorizes current contract to perform actions to itself
 */
abstract contract SelfAuthorized {
    error NotAuthorized();

    modifier authorized() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }
}
