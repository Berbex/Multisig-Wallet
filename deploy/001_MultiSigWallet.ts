import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {ethers} from "hardhat";

import {owners, threshold} from "../utils/constants";

const version = "v1.0.0";
const contractName = "MultiSigWallet";

const deployFunction: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const {deploy} = hre.deployments;
    const [deployer] = await ethers.getSigners();

    console.log(`\nDeploying ${contractName} ... \ndeployer: ${deployer.address}\n`);

    const constructorArgs = [owners, threshold];

    const result = await deploy(contractName, {
        from: deployer.address,
        waitConfirmations: 1,
        args: constructorArgs,
    });

    try {
        console.log("Verifying...");
        await hre.run("verify:verify", {
            address: result.address,
            contract: `contracts/${contractName}.sol:${contractName}`,
            constructorArguments: constructorArgs,
        });
    } catch (error) {
        console.log("Verification failed:", error);
    }

    return true;
};

export default deployFunction;

deployFunction.id = contractName + version;
deployFunction.tags = [contractName];
