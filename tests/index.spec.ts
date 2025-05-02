import {deployments} from "hardhat";

import ownerManager from "./OwnerManager.spec";
import multiSigWallet from "./MultiSigWallet.spec";

describe("MultiSigWallet Tests", function () {
    before(async function () {
        await deployments.fixture(["MultiSigWallet"], {keepExistingDeployments: true});
    });

    describe("OwnerManager", ownerManager);
    describe("MultiSigWallet", multiSigWallet);
});
