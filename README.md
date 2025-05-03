# MultiSigWallet Implementation

This repository provides a MultiSigWallet implementation inspired by [Safe Wallet](https://safe.global). It demonstrates key features and best practices such as EIP-712 and EIP-1271 signature standards, `k-of-n` threshold logic, and modular architecture using Solidity.

---

## 🌟 Purpose

The goal of this repository is to:

* Demonstrate how to implement a robust, modular MultiSigWallet smart contract system.
* Showcase the use of EIP-712 for structured data signing and EIP-1271 for smart contract signature validation.
* Provide a testable, extendable baseline inspired by an audited standard (Safe Wallet).
* Offer real usage examples and interactions through scripts to deploy, build, sign, and execute transactions.

---

## 📊 Core Features

* Support for `k-of-n` signatures (threshold logic)
* Any actor can execute a valid transaction with sufficient owner signatures
* Owners can be added or removed through signed transactions
* Full support for:

  * EIP-712 structured data signing
  * EIP-1271 smart contract signature validation
* Both `call` and `delegateCall` operations

---

## 📂 Contracts

* **HashManager**: Manages hash approvals. Allows owners to pre-approve transaction hashes.
* **OwnerManager**: Handles owners and threshold using a Solidity-efficient linked list.
* **SignatureChecker**: Extends `HashManager` and validates signatures using EIP-1271 and ECDSA.
* **MultiSigWallet**: Concrete implementation that exposes and integrates all core functionalities.

All contracts except `MultiSigWallet` are abstract and are inherited for modular logic separation.

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

### 2. Run Tests

```bash
yarn test
```


---

## 📱 Scripts & Usage

All scripts rely on configuration from `utils/constants.ts` and `.env`.

### Deployment

Set owners and threshold in `constants.ts`. Then deploy to Sepolia:

```bash
yarn deploy:multisig:sepolia
```

### Build Transaction

#### 1. Add New Owner

```bash
yarn multisig:build_tx:add_owner
```

* Updates `TransactionToSign` in constants with the addOwner transaction.
* You must set `SetNewOwner.newOwner` in constants before running.

#### 2. Transfer Funds

```bash
yarn multisig:build_tx:transfer_funds
```

* Updates `TransactionToSign` with a fund transfer.
* Set `TransferNativeToken.to` and `.value` beforehand.

### Sign Transaction

Signs a transaction using the mnemonic provided via `.env` under `SIGNER_MNEMONIC`:

```bash
yarn multisig:sign_tx
```

* Uses `TransactionToSign`
* Outputs a signature to be added to the `Signatures` array in constants

To generate multiple signatures:

* Change `SIGNER_MNEMONIC`
* Re-run script to generate another signature

### Execute Transaction

Executes the fully signed transaction:

```bash
yarn multisig:execute_tx
```

* Uses `TransactionToSign` and `Signatures`
* Sends the transaction via `execTransaction`
* Prints resulting transaction hash

### View Owners

```bash
yarn multisig:owners
```

* Outputs current owners of the MultiSigWallet

---

## 🎓 Learn More

* [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
* [EIP-1271: Standard Signature Validation Method for Contracts](https://eips.ethereum.org/EIPS/eip-1271)
* [Safe Contracts](https://github.com/safe-global/safe-contracts)

---

## 🚫 Disclaimer

This repository is for educational and demonstration purposes. Always perform your own audits and security checks before using in production.
