import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 100000,
    parallel: true,
  },
  networks: {
    hardhat: {
      // forking: {
      //   url: `${process.env.ETHEREUM_RPC_URL}`,
      //   blockNumber: 0, 
      // },
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL ? process.env.SEPOLIA_RPC_URL : "",
      chainId: 11155111,
      accounts: { mnemonic: process.env.DEPLOYER_MNEMONIC ? process.env.DEPLOYER_MNEMONIC : "" },
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL ? process.env.ETHEREUM_RPC_URL : "",
      chainId: 1,
      accounts: { mnemonic: process.env.DEPLOYER_MNEMONIC ? process.env.DEPLOYER_MNEMONIC : "" },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
