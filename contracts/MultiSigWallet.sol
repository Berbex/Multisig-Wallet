// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnerManager} from "./base/OwnerManager.sol";
import {HashManager} from "./base/HashManager.sol";
import {SignatureChecker} from "./base/SignatureChecker.sol";
import {IMultiSigWallet} from "./interfaces/IMultiSigWallet.sol";

contract MultiSigWallet is OwnerManager, SignatureChecker, IMultiSigWallet {
    // keccak256(
    //     "EIP712Domain(uint256 chainId,address verifyingContract)"
    // );
    /* solhint-disable private-vars-leading-underscore */
    bytes32 private constant DOMAIN_SEPARATOR_TYPEHASH = 0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218;
    /* solhint-enable private-vars-leading-underscore */

    // keccak256(
    //     "Tx(address to,uint256 value,bytes data,uint8 operation,uint256 nonce)"
    // );
    /* solhint-disable private-vars-leading-underscore */
    bytes32 private constant TX_TYPEHASH = 0xf401b8236cad45775f550996814981af00732da2509e517cd452b7a93fc2ff7d;
    /* solhint-enable private-vars-leading-underscore */

    uint256 public nonce;

    constructor(address[] memory owners, uint256 threshold) {
        _setupOwners(owners, threshold);
    }

    /// @inheritdoc IMultiSigWallet
    function execTransaction(address to, uint256 value, bytes calldata data, Operation operation, bytes calldata signatures) external payable {
        bytes32 txHash = getTransactionHash(to, value, data, operation, nonce++);
        checkSignatures(msg.sender, txHash, signatures);

        // We require some gas to emit the events (at least 2500) after the execution and some to perform code until the execution (500)
        if (gasleft() < 3000) revert NotEnoughGas();

        (bool success, bytes memory result) = _execute(to, value, data, operation, gasleft() - 2500);

        if (!success) {
            emit FailedExecution(txHash);

            if (result.length > 0) {
                /* solhint-disable no-inline-assembly */
                assembly {
                    revert(add(result, 32), mload(result))
                }
                /* solhint-enable no-inline-assembly */
            }

            revert ExecutionFailed();
        }

        emit SuccessfulExecution(txHash);
    }

    /// @inheritdoc IMultiSigWallet
    function checkSignatures(address executor, bytes32 dataHash, bytes calldata signatures) public view {
        uint256 nSignatures = _threshold;

        if (signatures.length < nSignatures * 65) revert WrongSignatureLength();

        address lastOwner = address(0);
        address currentOwner;

        for (uint256 i = 0; i < nSignatures; ++i) {
            currentOwner = _recoverSigner(executor, dataHash, signatures, i, nSignatures);

            if (currentOwner <= lastOwner || _owners[currentOwner] == address(0) || currentOwner == SENTINEL_OWNERS) revert WrongSignature();
            lastOwner = currentOwner;
        }
    }

    /// @inheritdoc IMultiSigWallet
    function domainSeparator() public view returns (bytes32) {
        uint256 chainId = block.chainid;

        return keccak256(abi.encode(DOMAIN_SEPARATOR_TYPEHASH, chainId, this));
    }

    /// @inheritdoc IMultiSigWallet
    function getTransactionHash(address to, uint256 value, bytes calldata data, Operation operation, uint256 _nonce) public view returns (bytes32 txHash) {
        bytes32 domainHash = domainSeparator();

        bytes32 calldataHash = keccak256(data);
        bytes32 txHashStruct = keccak256(abi.encode(TX_TYPEHASH, to, value, calldataHash, operation, _nonce));

        txHash = keccak256(abi.encodePacked("\x19\x01", domainHash, txHashStruct));
    }

    /// @inheritdoc IMultiSigWallet
    function approveHash(bytes32 hashToApprove) public override(IMultiSigWallet, HashManager) {
        if (_owners[msg.sender] == address(0)) revert WrongOwnerAddress();

        super.approveHash(hashToApprove);
    }

    /**
     * @notice Executes either a delegatecall or a call with provided parameters
     * @dev This method doesn't perform any sanity check of the transaction, such as:
     *      - if the contract at `to` address has code or not
     *      It is the responsibility of the caller to perform such checks.
     * @param to Destination address
     * @param value Ether value
     * @param data Data payload
     * @param operation Operation type
     * @return success boolean flag indicating if the call succeeded
     */
    function _execute(address to, uint256 value, bytes memory data, Operation operation, uint256 txGas) internal returns (bool success, bytes memory result) {
        if (operation == Operation.DelegateCall) {
            /* solhint-disable avoid-low-level-calls */
            (success, result) = to.delegatecall{gas: txGas}(data);
            /* solhint-enable avoid-low-level-calls */
        } else {
            (success, result) = to.call{gas: txGas, value: value}(data);
        }
    }
}
