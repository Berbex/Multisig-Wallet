// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ISignatureValidator} from "../interfaces/ISignatureValidator.sol";
import {ISignatureValidatorConstants} from "../interfaces/ISignatureValidatorConstants.sol";
import {HashManager} from "./HashManager.sol";

/**
 * @title SignatureChecker - Performs operations to check if a signature is valid
 * @dev This contract extends the HashManager contract to provide more options
 *      for checking the validity of a signature
 */
abstract contract SignatureChecker is HashManager, ISignatureValidatorConstants {
    // Error codes
    error WrongOffset();
    error WrongSignatureLength();
    error WrongSignature();

    /**
     * @dev Splits signature bytes into `uint8 v, bytes32 r, bytes32 s`
     *      Make sure to perform a bounds check for @param pos, to avoid out of bounds access on @param signatures
     *      The signature format is a compact form of {bytes32 r}{bytes32 s}{uint8 v}
     *      Compact means uint8 is not padded to 32 bytes
     * @param pos Position of the signature in the concatenated signatures byte array
     * @param signatures Concatenated {r, s, v} signatures
     * @return v Recovery ID or MultiSigWallet signature type
     * @return r Output value r of the signature
     * @return s Output value s of the signature
     */
    function _signatureSplit(bytes calldata signatures, uint256 pos) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        bytes calldata signaturePosition = bytes(signatures[pos * 65:pos * 65 + 65]);

        r = bytes32(signaturePosition[0:32]);
        s = bytes32(signaturePosition[32:64]);
        v = uint8(signaturePosition[64]);
    }

    /**
     * @dev Checks whether the contract signature is valid. Reverts otherwise
     * @param smartContract Address of the contract that should validate the signature
     * @param dataHash Hash of the data (could be either a message hash or transaction hash)
     * @param signatures Signatures concatenated and contract signature (EIP-1271) or approved hash
     * @param offset Offset to the start of the contract signature in the signatures byte array
     */
    function _checkContractSignature(address smartContract, bytes32 dataHash, bytes calldata signatures, uint256 offset) internal view {
        // Check that signature data pointer (s) is in bounds (points to the length of data -> 32 bytes)
        if (offset + 32 > signatures.length) revert WrongOffset();

        // Check if the contract signature is in bounds: start of data is s + 32 and end is start + signature length
        uint256 contractSignatureLen = uint256(bytes32(bytes(signatures[offset:offset + 32])));

        if (offset + 32 + contractSignatureLen > signatures.length) revert WrongSignatureLength();

        // Check signature
        bytes calldata contractSignature = bytes(signatures[offset + 32:offset + 32 + contractSignatureLen]);

        if (ISignatureValidator(smartContract).isValidSignature(dataHash, contractSignature) != EIP1271_MAGIC_VALUE) revert WrongSignature();
    }

    /**
     * @dev Recovers the signer of a message hash
     * @param executor Address of the executor
     * @param dataHash Hash of the data (could be either a message hash or transaction hash)
     * @param signatures Signatures concatenated and contract signature (EIP-1271) or approved hash
     * @param pos Position of the signature in the concatenated signatures byte array
     * @param requiredSignatures Number of required signatures to authorize the transaction
     * @return owner Address of the owner that signed the message
     */
    function _recoverSigner(
        address executor,
        bytes32 dataHash,
        bytes calldata signatures,
        uint256 pos,
        uint256 requiredSignatures
    ) internal view returns (address owner) {
        (uint8 v, bytes32 r, bytes32 s) = _signatureSplit(signatures, pos);

        if (v == 0) {
            // Owner is a contract
            owner = address(uint160(uint256(r)));

            // Check that the pointer (s) is pointing out of valid signature range
            if (uint256(s) < requiredSignatures * 65) revert WrongSignature();

            _checkContractSignature(owner, dataHash, signatures, uint256(s));
        } else if (v == 1) {
            owner = address(uint160(uint256(r)));

            if (executor != owner && !approvedHashes[owner][dataHash]) revert WrongSignature();
        } else if (v > 30) {
            // To support eth_sign and similar we adjust v and hash the messageHash with the Ethereum message prefix before applying ecrecover
            owner = ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash)), v - 4, r, s);
        } else {
            // Use ecrecover with the messageHash for EOA signatures
            owner = ecrecover(dataHash, v, r, s);
        }
    }
}
