import {expect} from "chai";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {ethers} from "hardhat";

import {buildContractCall, signTypedData, buildSignatureBytes, calculateTransactionHash, approveHash, Signature, signHash} from "../utils/execution";

import type {MultiSigWallet} from "../typechain-types";

export default async function suite(): Promise<void> {
    describe("MultiSigWallet", function () {
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

        describe("Hash tests", () => {
            it("non-owner can not approve hash", async () => {
                await expect(multiSigWallet.connect(user1).approveHash(ethers.ZeroHash)).to.be.revertedWithCustomError(multiSigWallet, "WrongOwnerAddress");
            });

            it("owner can approve hash", async () => {
                expect(await multiSigWallet.approvedHashes(deployer.address, ethers.ZeroHash)).to.be.false;

                await multiSigWallet.connect(deployer).approveHash(ethers.ZeroHash);

                expect(await multiSigWallet.approvedHashes(deployer.address, ethers.ZeroHash)).to.be.true;
            });

            it("user can execute transaction with approved hash", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await approveHash(deployer);

                const signatureBytes = buildSignatureBytes([signature]);

                const txHash = calculateTransactionHash(await multiSigWallet.getAddress(), tx, chainId);

                await multiSigWallet.connect(deployer).approveHash(txHash);

                await expect(multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)).to.emit(
                    multiSigWallet,
                    "SuccessfulExecution"
                );
            });

            it("emits event when approving hash", async () => {
                await expect(multiSigWallet.connect(deployer).approveHash(ethers.ZeroHash))
                    .to.emit(multiSigWallet, "HashApproved")
                    .withArgs(ethers.ZeroHash, deployer.address);
            });
        });

        describe("Transaction tests", () => {
            it("nonce should increment after transaction", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                const nonceBefore = await multiSigWallet.nonce();
                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);
                const nonceAfter = await multiSigWallet.nonce();

                expect(nonceAfter).to.equal(nonceBefore + 1n);
            });

            it("signature length should be greater or equal to n * 65", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, ethers.ZeroHash)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongSignatureLength");
            });

            it("contract signer can not execute transaction if isValidSignature returns wrong selector", async () => {
                const TestSignatureVerifier = await ethers.getContractFactory("TestSignatureVerifier");
                const testSignatureVerifier = await TestSignatureVerifier.deploy();

                const tx = await buildContractCall(multiSigWallet, "addOwner", [await testSignatureVerifier.getAddress()], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0); // wrong nonce

                const ownerSignature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const ownerSignatureBytes = buildSignatureBytes([ownerSignature]);

                const signature2: Signature = {
                    signer: await testSignatureVerifier.getAddress(),
                    data: ownerSignatureBytes,
                    dynamic: true,
                };

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongSignature");
            });

            it("contract signer can not execute transaction if is not a owner", async () => {
                const TestSignatureVerifier = await ethers.getContractFactory("TestSignatureVerifier");
                const testSignatureVerifier = await TestSignatureVerifier.deploy();

                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);

                const ownerSignature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const ownerSignatureBytes = buildSignatureBytes([ownerSignature]);

                const signature: Signature = {
                    signer: await testSignatureVerifier.getAddress(),
                    data: ownerSignatureBytes,
                    dynamic: true,
                };

                const signatureBytes2 = buildSignatureBytes([signature]);

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes2)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongSignature");
            });

            it("contract signer can execute transaction", async () => {
                const TestSignatureVerifier = await ethers.getContractFactory("TestSignatureVerifier");
                const testSignatureVerifier = await TestSignatureVerifier.deploy();

                const tx = await buildContractCall(multiSigWallet, "addOwner", [await testSignatureVerifier.getAddress()], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 1);

                const ownerSignature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const ownerSignatureBytes = buildSignatureBytes([ownerSignature]);

                const signature2: Signature = {
                    signer: await testSignatureVerifier.getAddress(),
                    data: ownerSignatureBytes,
                    dynamic: true,
                };

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2)).to.emit(
                    multiSigWallet,
                    "SuccessfulExecution"
                );

                expect(await multiSigWallet.isOwner(user1.address)).to.be.true;
            });

            it("owner can execute transaction if is executor", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await approveHash(deployer);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(multiSigWallet.connect(deployer).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes)).to.emit(
                    multiSigWallet,
                    "SuccessfulExecution"
                );
            });

            it("owner can execute transaction if use Signed Ethereum Messages", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const txHash = calculateTransactionHash(await multiSigWallet.getAddress(), tx, chainId);

                const signature = await signHash(deployer, txHash);

                const signatureBytes = buildSignatureBytes([signature]);

                expect(await multiSigWallet.isOwner(user1.address)).to.be.false;

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                expect(await multiSigWallet.isOwner(user1.address)).to.be.true;
            });

            it("owner can execute delegate call transaction", async () => {
                const DelegateCallVerifier = await ethers.getContractFactory("DelegateCallVerifier");
                const delegateCallVerifier = await DelegateCallVerifier.deploy();

                const tx = await buildContractCall(delegateCallVerifier, "verifyDelegateCall", [await delegateCallVerifier.getAddress()], 0, 0, true);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                expect(await delegateCallVerifier.caller()).to.equal(await multiSigWallet.getAddress());

                // Perform a second call to the same function to check if the caller delegateCallVerifier and not the multiSigWallet

                const tx2 = await buildContractCall(delegateCallVerifier, "verifyDelegateCall", [await delegateCallVerifier.getAddress()], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2);

                expect(await delegateCallVerifier.caller()).to.equal(await delegateCallVerifier.getAddress());
            });

            it("user can not execute transaction if has not enough signatures", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "changeThreshold", [2], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2);

                const tx3 = await buildContractCall(multiSigWallet, "addOwner", [user2.address], 0, 2);
                const signature3_1 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx3, chainId);

                const signatureBytes3 = buildSignatureBytes([signature3_1]); // Missing signature from user1

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx3.to, tx3.value, tx3.data, tx3.operation, signatureBytes3)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongSignatureLength");

                const signatureBytes4 = buildSignatureBytes([signature3_1, signature3_1]); // Reaching the correct length but not the correct signatures

                await expect(
                    multiSigWallet.connect(user1).execTransaction(tx3.to, tx3.value, tx3.data, tx3.operation, signatureBytes4)
                ).to.be.revertedWithCustomError(multiSigWallet, "WrongSignature");
            });

            it("user can execute transaction if has enough signatures", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes);

                const tx2 = await buildContractCall(multiSigWallet, "changeThreshold", [2], 0, 1);
                const signature2 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx2, chainId);

                const signatureBytes2 = buildSignatureBytes([signature2]);

                await multiSigWallet.connect(user1).execTransaction(tx2.to, tx2.value, tx2.data, tx2.operation, signatureBytes2);

                const tx3 = await buildContractCall(multiSigWallet, "addOwner", [user2.address], 0, 2);
                const signature3_1 = await signTypedData(deployer, await multiSigWallet.getAddress(), tx3, chainId);
                const signature3_2 = await signTypedData(user1, await multiSigWallet.getAddress(), tx3, chainId);

                const signatureBytes3 = buildSignatureBytes([signature3_1, signature3_2]);

                await multiSigWallet.connect(user1).execTransaction(tx3.to, tx3.value, tx3.data, tx3.operation, signatureBytes3);

                expect(await multiSigWallet.isOwner(user2.address)).to.be.true;
                expect(await multiSigWallet.isOwner(user1.address)).to.be.true;
                expect(await multiSigWallet.isOwner(deployer.address)).to.be.true;
            });

            it("emits event when executing transaction", async () => {
                const tx = await buildContractCall(multiSigWallet, "addOwner", [user1.address], 0, 0);
                const signature = await signTypedData(deployer, await multiSigWallet.getAddress(), tx, chainId);

                const txHash = calculateTransactionHash(await multiSigWallet.getAddress(), tx, chainId);

                const signatureBytes = buildSignatureBytes([signature]);

                await expect(multiSigWallet.connect(user1).execTransaction(tx.to, tx.value, tx.data, tx.operation, signatureBytes))
                    .to.emit(multiSigWallet, "SuccessfulExecution")
                    .withArgs(txHash);
            });
        });
    });
}
