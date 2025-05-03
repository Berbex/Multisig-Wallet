import {ethers} from "hardhat";

import {buildContractCall} from "../utils/execution";
import {SetNewOwner} from "../utils/constants";

import type {MultiSigWallet} from "../typechain-types";

(async () => {
    let multiSigWalletContract = await ethers.getContractOrNull("MultiSigWallet");
    if (!multiSigWalletContract) throw new Error("MultiSigWallet not deployed");

    const multiSigWallet = multiSigWalletContract as MultiSigWallet;

    const nonce = await multiSigWallet.nonce();

    if (SetNewOwner.newOwner == ethers.ZeroAddress) throw new Error("No new owner provided");

    const tx = await buildContractCall(multiSigWallet, "addOwner", [SetNewOwner.newOwner], 0, nonce);

    console.log("Transaction built:");
    console.dir(tx);
})();
