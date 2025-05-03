import {Transaction, Signature} from "./execution";

export const Owners: string[] = ["0x6d57E5fc5cf72c02b55Bd313e0878B4c8Fcd5b71"];
export const Threshold: number = 1;

export const AddressOne = "0x0000000000000000000000000000000000000001";

export const SetNewOwner = {
    newOwner: "0x166413eF8b4DAb37B2295f4cCBc820eF5A78c817",
};

export const TransferNativeToken = {
    to: "0x6d57E5fc5cf72c02b55Bd313e0878B4c8Fcd5b71",
    value: 1,
};

export const TransactionToSign: Transaction = {
    to: "0x8CA9c3D95f01a3C5C9eB451401DBD887b0959836",
    value: 0,
    data: "0x7065cb48000000000000000000000000166413ef8b4dab37b2295f4ccbc820ef5a78c817",
    operation: 0,
    nonce: 0n,
};

export const Signatures: Signature[] = [
    {
        signer: "0x6d57E5fc5cf72c02b55Bd313e0878B4c8Fcd5b71",
        data: "0x7dae698c67e9025227aa4306248990efbe6af61ae8a76f9f5b33d348e81eae5251895fc567b14e8e32badc14739ead6464c43b1690a010f8ce226005909625161c",
    },
];
