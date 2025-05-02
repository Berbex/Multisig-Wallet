import {expect} from "chai";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {ethers} from "hardhat";

import {buildContractCall, signTypedData, buildSignatureBytes} from "../utils/execution";
import {AddressOne} from "../utils/constants";

import type {MultiSigWallet} from "../typechain-types";

export default async function suite(): Promise<void> {
    describe("OwnerManager", function () {
        let multiSigWallet: MultiSigWallet;
        let deployer: SignerWithAddress;
        let user1: SignerWithAddress;
        let user2: SignerWithAddress;

        let chainId: bigint;

        let snap: string;

        before(async function () {
            multiSigWallet = await ethers.getContract("MultiSigWallet");

            [deployer, user1, user2] = await ethers.getSigners();

            chainId = (await ethers.provider.getNetwork()).chainId;
        });

        beforeEach(async function () {
            snap = await ethers.provider.send("evm_snapshot", []);
        });

        afterEach(async function () {
            await ethers.provider.send("evm_revert", [snap]);
        });

        describe("addOwner", () => {
            it("can only be called from MultiSigWallet itself", async () => {
                await expect(multiSigWallet.addOwner(user2.address)).to.be.revertedWithCustomError(multiSigWallet, "NotAuthorized");
            });

            it("can not set MultiSigWallet itself", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [await multiSigWallet.getAddress()], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(multiSigWallet.execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)).to.be.revertedWithCustomError(
                    multiSigWallet,
                    "WrongOwnerAddress"
                );
            });

            it("can not set sentinel", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [AddressOne], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("can not set 0 Address", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [ethers.ZeroAddress], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("can not add owner twice", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("emits event for new owner", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes))
                    .to.emit(multiSigWallet, "OwnerAdded")
                    .withArgs(user1.address);

                expect(await multiSigWallet.getThreshold()).to.equal(1n);
                expect(await multiSigWallet.isOwner(user1.address)).to.be.true;
                expect(await multiSigWallet.getOwners()).to.deep.eq([user1.address, deployer.address]);
            });
        });

        describe("removeOwner", () => {
            it("can only be called from MultiSigWallet itself", async () => {
                await expect(multiSigWallet.removeOwner(AddressOne, user1.address)).to.be.revertedWithCustomError(multiSigWallet, "NotAuthorized");
            });

            it("can not remove sentinel", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "removeOwner", [user1.address, AddressOne], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("can not remove 0 Address", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "removeOwner", [user1.address, ethers.ZeroAddress], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("Invalid prevOwner, owner pair provided - Invalid target", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "removeOwner", [AddressOne, deployer.address], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("Invalid prevOwner, owner pair provided - Invalid sentinel", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "removeOwner", [ethers.ZeroAddress, deployer.address], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("Invalid prevOwner, owner pair provided - Invalid source", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "removeOwner", [deployer.address, user1.address], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("can not remove owner only owner", async () => {
                const tx = await buildContractCall(multiSigWallet, "removeOwner", [AddressOne, deployer.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)
                ).to.be.revertedWithCustomError(multiSigWallet, "ThresholdNotReachable");
            });

            it("emits event for removed owner", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "addOwner", [user2.address], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2);

                const tx3 = await buildContractCall(multiSigWallet, "removeOwner", [user2.address, user1.address], 0, 2);
                const signature3 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx3, chainId);

                const signatureBytes3 = buildSignatureBytes([signature3]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx3.to, tx3.value, tx3.data, tx3.operation, signatureBytes3))
                    .to.emit(multiSigWallet, "OwnerRemoved")
                    .withArgs(user1.address);

                expect(await multiSigWallet.getOwners()).to.be.deep.equal([user2.address, deployer.address]);
                expect(await multiSigWallet.isOwner(user1.address)).to.be.false;
                expect(await multiSigWallet.isOwner(user2.address)).to.be.true;
                expect(await multiSigWallet.isOwner(deployer.address)).to.be.true;

                const tx4 = await buildContractCall(multiSigWallet, "removeOwner", [AddressOne, user2.address], 0, 3);
                const signature4 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx4, chainId);

                const signatureBytes4 = buildSignatureBytes([signature4]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx4.to, tx4.value, tx4.data, tx4.operation, signatureBytes4))
                    .to.emit(multiSigWallet, "OwnerRemoved")
                    .withArgs(user2.address);

                await expect(await multiSigWallet.getOwners()).to.be.deep.equal([deployer.address]);
                expect(await multiSigWallet.isOwner(user1.address)).to.be.false;
                expect(await multiSigWallet.isOwner(user2.address)).to.be.false;
                expect(await multiSigWallet.isOwner(deployer.address)).to.be.true;
            });
        });

        describe("changeThreshold", () => {
            it("can only be called from MultiSigWallet itself", async () => {
                await expect(multiSigWallet.changeThreshold(1n)).to.be.revertedWithCustomError(multiSigWallet, "NotAuthorized");
            });

            it("can not set 0 threshold", async () => {
                const tx = await buildContractCall(multiSigWallet, "changeThreshold", [0n], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongInput");
            });

            it("can not set threshold higher than owners count", async () => {
                const tx = await buildContractCall(multiSigWallet, "changeThreshold", [2n], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongInput");

                const tx2 = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2);

                const tx3 = await buildContractCall(multiSigWallet, "changeThreshold", [2n], 0, 1);
                const signature3 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx3, chainId);

                const signatureBytes3 = buildSignatureBytes([signature3]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx3.to, tx3.value, tx3.data, tx3.operation, signatureBytes3)).to.be.not.reverted;

                expect(await multiSigWallet.getThreshold()).to.equal(2n);
            });

            it("emits event for changed threshold", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "changeThreshold", [2n], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2))
                    .to.emit(multiSigWallet, "ThresholdChanged")
                    .withArgs(2n);
            });
        });
    });
}
