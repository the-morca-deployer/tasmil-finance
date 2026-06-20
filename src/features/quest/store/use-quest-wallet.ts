// Wallet connection is GLOBAL across the whole app (landing, chat, quest).
// Quest reuses the app-wide wallet store (localStorage key "wallet-storage")
// instead of a separate "quest-wallet-storage", so a wallet connected on any
// surface is connected everywhere, and disconnect is shared. The store API
// (connected / account / signing / setWalletState / setSigning / reset) is
// identical, so quest consumers need no change.
export { useWalletStore as useQuestWalletStore } from "@/store/use-wallet";
