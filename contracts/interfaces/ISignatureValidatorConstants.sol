// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ISignatureValidatorConstants {
    // bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 internal constant EIP1271_MAGIC_VALUE = 0x1626ba7e;
}
