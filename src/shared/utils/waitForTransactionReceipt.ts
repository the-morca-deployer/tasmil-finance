import { waitForTransactionReceipt as waitForTransactionReceiptWagmi } from "wagmi/actions";
import { wagmiConfig } from "@/shared/config/wagmi";

export const waitForTransactionReceipt = async (hash: `0x${string}`) => {
  const receipt = await waitForTransactionReceiptWagmi(wagmiConfig, { hash });
  return {
    receipt,
    isConfirmed: receipt.status === "success",
  };
};
