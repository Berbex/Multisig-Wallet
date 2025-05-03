// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ISignatureValidatorConstants - Constants for EIP1271 signature validation
 * @dev This contract defines the magic value used in EIP1271 signature validation
 */
abstract contract ISignatureValidatorConstants {
    // bytes4(keccak256("isValidSignature(bytes32,bytes)")
    /* solhint-disable private-vars-leading-underscore */
    bytes4 internal constant EIP1271_MAGIC_VALUE = 0x1626ba7e;
    /* solhint-enable private-vars-leading-underscore */
}
