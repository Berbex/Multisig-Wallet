import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {ethers} from "hardhat";

import {Owners, Threshold} from "../utils/constants";

const version = "v1.0.0";
const contractName = "MultiSigWallet";

// Initial owners and threshold are set in the constants file

const deployFunction: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const {deploy} = hre.deployments;
    const [deployer] = await ethers.getSigners();

    console.log(`\nDeploying ${contractName} ... \ndeployer: ${deployer.address}\n`);

    let constructorArgs = [Owners, Threshold];
    if (hre.network.name === "hardhat") constructorArgs = [[deployer.address], 1]; // Default for testing

    const result = await deploy(contractName, {
        from: deployer.address,
        waitConfirmations: 1,
        args: constructorArgs,
    });

    console.log(`\n${contractName} deployed to: ${result.address}`);

    return true;
};

export default deployFunction;

deployFunction.id = contractName + version;
deployFunction.tags = [contractName];
