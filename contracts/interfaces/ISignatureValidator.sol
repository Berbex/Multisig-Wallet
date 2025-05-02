// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ISignatureValidatorConstants} from "./ISignatureValidatorConstants.sol";

abstract contract ISignatureValidator is ISignatureValidatorConstants {
    /**
     * @notice EIP1271 method to validate a signature
     * @param _hash Hash of the data signed on the behalf of address(this)
     * @param _signature Signature byte array associated with _data
     *
     * MUST return the bytes4 magic value 0x1626ba7e when function passes
     * MUST NOT modify state (using STATICCALL for solc < 0.5, view modifier for solc > 0.5)
     * MUST allow external calls
     */
    function isValidSignature(bytes32 _hash, bytes memory _signature) external view virtual returns (bytes4);
}
