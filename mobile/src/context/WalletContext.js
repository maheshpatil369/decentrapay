import React, { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";

/**
 * Mobile WalletContext
 *
 * Supports two wallet modes:
 *  1. Dummy wallet  — private key injected directly (dev / hackathon use)
 *  2. WalletConnect — connects MetaMask mobile, Rainbow, Trust, etc.
 *
 * Private keys are held only in React state (in-memory).
 * Production: use react-native-keychain for secure device storage.
 */

const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL || "https://rpc.sepolia.org";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account,    setAccount]    = useState(null);
  const [balance,    setBalance]    = useState("0");
  const [signer,     setSigner]     = useState(null);
  const [provider,   setProvider]   = useState(null);
  const [walletType, setWalletType] = useState(null); // "dummy" | "walletconnect"
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const clearError = () => setError(null);

  // ── Balance refresh ───────────────────────────────────────────
  const refreshBalance = useCallback(async (addr, prov) => {
    try {
      const raw = await (prov || provider).getBalance(addr || account);
      setBalance(ethers.formatEther(raw));
    } catch {
      // non-critical — RPC may not be ready yet
    }
  }, [account, provider]);

  // ── Dummy wallet connect ──────────────────────────────────────
  const connectDummy = useCallback(async (privateKey) => {
    setError(null);
    setLoading(true);
    try {
      const prov = new ethers.JsonRpcProvider(RPC_URL);
      const sign = new ethers.Wallet(privateKey, prov);
      setProvider(prov);
      setSigner(sign);
      setAccount(sign.address);
      setWalletType("dummy");
      await refreshBalance(sign.address, prov);
    } catch (e) {
      setError(e.message || "Failed to connect dummy wallet");
    } finally {
      setLoading(false);
    }
  }, [refreshBalance]);

  // ── Generate fresh wallet (dev use) ──────────────────────────
  const generateWallet = () => {
    const w = ethers.Wallet.createRandom();
    return {
      address:    w.address,
      privateKey: w.privateKey,
      mnemonic:   w.mnemonic?.phrase,
    };
  };

  // ── Disconnect ────────────────────────────────────────────────
  const disconnect = () => {
    setAccount(null);
    setBalance("0");
    setSigner(null);
    setProvider(null);
    setWalletType(null);
  };

  // ── Send payment via contract ─────────────────────────────────
  const sendPayment = useCallback(async ({
    contractAddress,
    abi,
    recipient,
    amountEth,
    message = "",
  }) => {
    if (!signer) throw new Error("No wallet connected");
    if (!ethers.isAddress(recipient)) throw new Error("Invalid recipient address");
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const value    = ethers.parseEther(amountEth.toString());
    const tx       = await contract.sendPayment(recipient, message, { value });
    return tx;
  }, [signer]);

  return (
    <WalletContext.Provider value={{
      account,
      balance,
      signer,
      walletType,
      loading,
      error,
      clearError,
      connectDummy,
      generateWallet,
      disconnect,
      sendPayment,
      refreshBalance: () => refreshBalance(account, provider),
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside <WalletProvider>");
  return ctx;
};
