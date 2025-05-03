import {ethers} from "hardhat";

import {buildSignatureBytes} from "../utils/execution";
import {Signatures, TransactionToSign} from "../utils/constants";

import type {MultiSigWallet} from "../typechain-types";

(async () => {
    let multiSigWalletContract = await ethers.getContractOrNull("MultiSigWallet");
    if (!multiSigWalletContract) throw new Error("MultiSigWallet not deployed");

    const multiSigWallet = multiSigWalletContract as MultiSigWallet;

    const signatureBytes = buildSignatureBytes(Signatures);

    let tx;

    try {
        tx = await multiSigWallet.execTransaction(
            TransactionToSign.to,
            TransactionToSign.value,
            TransactionToSign.data,
            TransactionToSign.operation,
            signatureBytes
        );
    } catch (error) {
        console.error("Error executing transaction:", error);
        return;
    }

    console.log("Transaction executed successfully");
    console.log("Transaction hash:", tx.hash);
})();
