import {ethers, getChainId} from "hardhat";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

import {signTypedData} from "../utils/execution";
import {TransactionToSign} from "../utils/constants";

import type {MultiSigWallet} from "../typechain-types";

(async () => {
    let multiSigWalletContract = await ethers.getContractOrNull("MultiSigWallet");
    if (!multiSigWalletContract) throw new Error("MultiSigWallet not deployed");

    const multiSigWallet = multiSigWalletContract as MultiSigWallet;
    const chainId = await getChainId();

    if (process.env.SIGNER_MNEMONIC == undefined || process.env.SIGNER_MNEMONIC == "") throw new Error("SIGNER_MNEMONIC not set");

    const signer = ethers.Wallet.fromPhrase(process.env.SIGNER_MNEMONIC) as any as SignerWithAddress;

    console.log("Signer address:", signer.address);

    const signature = await signTypedData(signer, await multiSigWallet.getAddress(), TransactionToSign, chainId);

    console.log("Signature:", signature);
})();
