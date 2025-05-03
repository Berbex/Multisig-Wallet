import {ethers} from "hardhat";

import type {MultiSigWallet} from "../typechain-types";

(async () => {
    let multiSigWalletContract = await ethers.getContractOrNull("MultiSigWallet");
    if (!multiSigWalletContract) throw new Error("MultiSigWallet not deployed");

    const multiSigWallet = multiSigWalletContract as MultiSigWallet;

    const owners = await multiSigWallet.getOwners();

    console.log("Owners:", owners);
})();
