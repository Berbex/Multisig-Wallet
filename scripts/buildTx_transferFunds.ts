import {ethers} from "hardhat";

import {buildTransaction} from "../utils/execution";
import {TransferNativeToken} from "../utils/constants";

import type {MultiSigWallet} from "../typechain-types";

(async () => {
    let multiSigWalletContract = await ethers.getContractOrNull("MultiSigWallet");
    if (!multiSigWalletContract) throw new Error("MultiSigWallet not deployed");

    const multiSigWallet = multiSigWalletContract as MultiSigWallet;

    const nonce = await multiSigWallet.nonce();

    if (TransferNativeToken.value == 0 || TransferNativeToken.to == ethers.ZeroAddress) throw new Error("No value or user provided");

    const tx = buildTransaction({
        to: TransferNativeToken.to,
        value: TransferNativeToken.value,
        data: "0x",
        operation: 0,
        nonce: nonce,
    });

    console.log("Transaction built:");
    console.dir(tx);
})();
