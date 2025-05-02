// SPDX-License-Identifier: MIT
// solhint-disable one-contract-per-file
pragma solidity ^0.8.28;

interface ERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4 magicValue);
}

/**
 * @title TestSignatureVerifier - A simple test contract
 */
contract TestSignatureVerifier {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function isValidSignature(bytes32 _hash, bytes calldata _signature) external view returns (bytes4 magic) {
        // Validate signatures
        if (_recoverSigner(_hash, _signature) == owner) magic = ERC1271.isValidSignature.selector;
        else magic = 0xffffffff;
    }

    /**
     * @notice Recover the signer of hash, assuming it's an EOA account
     * @dev Only for EthSign signatures
     * @param _hash       Hash of message that was signed
     * @param _signature  Signature encoded as (bytes32 r, bytes32 s, uint8 v)
     */
    function _recoverSigner(bytes32 _hash, bytes calldata _signature) internal pure returns (address signer) {
        require(_signature.length == 65, "SignatureValidator#recoverSigner: invalid signature length");

        // Variables are not scoped in Solidity.
        bytes32 r = bytes32(_signature[0:32]);
        bytes32 s = bytes32(_signature[32:64]);
        uint8 v = uint8(_signature[64]);

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        //
        // Source OpenZeppelin
        // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/cryptography/ECDSA.sol

        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert("SignatureValidator#recoverSigner: invalid signature 's' value");
        }

        if (v != 27 && v != 28) {
            revert("SignatureValidator#recoverSigner: invalid signature 'v' value");
        }

        // Recover ECDSA signer
        signer = ecrecover(_hash, v, r, s);

        // Prevent signer from being 0x0
        require(signer != address(0x0), "SignatureValidator#recoverSigner: INVALID_SIGNER");

        return signer;
    }
}
