import {BigNumberish, BaseContract, ethers} from "ethers";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";

export const EIP712_TX_TYPE = {
    // "Tx(address to,uint256 value,bytes data,uint8 operation,uint256 nonce)"
    Tx: [
        {type: "address", name: "to"},
        {type: "uint256", name: "value"},
        {type: "bytes", name: "data"},
        {type: "uint8", name: "operation"},
        {type: "uint256", name: "nonce"},
    ],
};

export type Transaction = {
    to: string;
    value: BigNumberish;
    data: string;
    operation: number;
    nonce: BigNumberish;
};

export type Signature = {
    signer: string;
    data: string;
    // a flag to indicate if the signature is a contract signature and the data has to be appended to the dynamic part of signature bytes
    dynamic?: true;
};

export const buildContractCall = async (
    contract: BaseContract,
    method: string,
    params: unknown[],
    value: BigNumberish,
    nonce: BigNumberish,
    delegateCall?: boolean
): Promise<Transaction> => {
    const data = contract.interface.encodeFunctionData(method, params);
    const contractAddress = await contract.getAddress();

    return buildTransaction({
        to: contractAddress,
        value: value,
        data,
        operation: delegateCall ? 1 : 0,
        nonce,
    });
};

export const buildTransaction = (transaction: Transaction): Transaction => {
    return {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        operation: transaction.operation,
        nonce: transaction.nonce,
    };
};

export const signTypedData = async (signer: HardhatEthersSigner, multiSigWalletAddress: string, tx: Transaction, chainId: BigNumberish): Promise<Signature> => {
    return {
        signer: signer.address,
        data: await signer.signTypedData({verifyingContract: multiSigWalletAddress, chainId: chainId}, EIP712_TX_TYPE, tx),
    };
};

export const calculateTransactionHash = (multiSigWalletAddress: string, tx: Transaction, chainId: BigNumberish): string => {
    return ethers.TypedDataEncoder.hash({verifyingContract: multiSigWalletAddress, chainId}, EIP712_TX_TYPE, tx);
};

export const buildSignatureBytes = (signatures: Signature[]): string => {
    const SIGNATURE_LENGTH_BYTES = 65;
    signatures.sort((left, right) => left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()));

    let signatureBytes = "0x";
    let dynamicBytes = "";
    for (const sig of signatures) {
        if (sig.dynamic) {
            /* 
                A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended 
                at the end of signature bytes.
                The signature format is
                Signature type == 0
                Constant part: 65 bytes
                {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
                Dynamic part (solidity bytes): 32 bytes + signature data length
                {32-bytes signature length}{bytes signature data}
            */
            const dynamicPartPosition = (signatures.length * SIGNATURE_LENGTH_BYTES + dynamicBytes.length / 2).toString(16).padStart(64, "0");
            const dynamicPartLength = (sig.data.slice(2).length / 2).toString(16).padStart(64, "0");
            const staticSignature = `${sig.signer.slice(2).padStart(64, "0")}${dynamicPartPosition}00`;
            const dynamicPartWithLength = `${dynamicPartLength}${sig.data.slice(2)}`;

            signatureBytes += staticSignature;
            dynamicBytes += dynamicPartWithLength;
        } else {
            signatureBytes += sig.data.slice(2);
        }
    }

    return signatureBytes + dynamicBytes;
};
