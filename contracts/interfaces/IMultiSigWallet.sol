// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IMultiSigWallet - Interface for a MultiSig Wallet contract
 */
interface IMultiSigWallet {
    // Error codes
    error NotEnoughGas();
    error ExecutionFailed();

    /**
     * @notice Emitted when a transaction is executed successfully
     * @param txHash The hash of the transaction that was executed
     */
    event SuccessfulExecution(bytes32 indexed txHash);

    /**
     * @notice Emitted when a transaction fails to execute
     * @param txHash The hash of the transaction that failed
     */
    event FailedExecution(bytes32 indexed txHash);

    /**
     * @notice Enum to define the operation type
     * @dev 0: Call, 1: DelegateCall
     */
    enum Operation {
        Call,
        DelegateCall
    }

    /**
     * @notice Executes a `operation` {0: Call, 1: DelegateCall} transaction to `to` with `value` (Native Currency)
     * @dev This method doesn't perform any sanity check of the transaction, such as:
     *      - if the contract at `to` address has code or not
     *      It is the responsibility of the caller to perform such checks
     * @param to Destination address of Safe transaction
     * @param value Ether value of Safe transaction
     * @param data Data payload of Safe transaction
     * @param operation Operation type of Safe transaction
     * @param signatures Signatures data that should be verified
     *                   Can be packed ECDSA signature ({bytes32 r}{bytes32 s}{uint8 v}), contract signature (EIP-1271) or approved hash
     */
    function execTransaction(address to, uint256 value, bytes calldata data, Operation operation, bytes calldata signatures) external payable;

    /**
     * @notice Checks whether the signature provided is valid for the provided data and hash and executor. Reverts otherwise
     * @param executor Address that executes the transaction
     * @param dataHash Hash of the data (could be either a message hash or transaction hash)
     * @param signatures Signature data that should be verified
     *                   Can be packed ECDSA signature ({bytes32 r}{bytes32 s}{uint8 v}), contract signature (EIP-1271) or approved hash
     */
    function checkSignatures(address executor, bytes32 dataHash, bytes calldata signatures) external view;

    /**
     * @notice Returns the domain separator for this contract, as defined in the EIP-712 standard
     * @return bytes32 The domain separator hash
     */
    function domainSeparator() external view returns (bytes32);

    /**
     * @notice Returns transaction hash to be signed by owners
     * @param to Destination address
     * @param value Ether value
     * @param data Data payload
     * @param operation Operation type
     * @param _nonce Transaction nonce
     * @return txHash Transaction hash
     */
    function getTransactionHash(address to, uint256 value, bytes calldata data, Operation operation, uint256 _nonce) external view returns (bytes32 txHash);

    /**
     * @notice Marks hash `hashToApprove` as approved
     * @dev This can be used with a pre-approved hash transaction signature
     *      IMPORTANT: The approved hash stays approved forever. There's no revocation mechanism, so it behaves similarly to ECDSA signatures
     * @param hashToApprove The hash to mark as approved for signatures that are verified by this contract
     */
    function approveHash(bytes32 hashToApprove) external;
}
