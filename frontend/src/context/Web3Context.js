import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../abi/DecentraPay";

const SEPOLIA_CHAIN_ID   = "0xaa36a7";
const SEPOLIA_CHAIN_INT  = 11155111n;
const LOCAL_CHAIN_INT    = 31337n;
const RPC_URL            = process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account,       setAccount]       = useState(null);
  const [balance,       setBalance]       = useState("0");
  const [provider,      setProvider]      = useState(null);
  const [signer,        setSigner]        = useState(null);
  const [contract,      setContract]      = useState(null);
  const [network,       setNetwork]       = useState(null);
  const [walletType,    setWalletType]    = useState(null); // "metamask" | "dummy"
  const [isConnecting,  setIsConnecting]  = useState(false);
  const [error,         setError]         = useState(null);

  // ── helpers ────────────────────────────────────────────────────
  const clearError = () => setError(null);

  const refreshBalance = useCallback(async (addr, prov) => {
    if (!addr || !prov) return;
    try {
      const raw = await prov.getBalance(addr);
      setBalance(ethers.formatEther(raw));
    } catch { /* non-critical */ }
  }, []);

  const attachContract = useCallback((signerOrProvider) =>
    new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider),
  []);

  // ── MetaMask connect ───────────────────────────────────────────
  const connectMetaMask = useCallback(async () => {
    setError(null); setIsConnecting(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed. Get it at metamask.io");

      // Request accounts
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      // Switch to / add Sepolia
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (sw) {
        if (sw.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Test Network",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        } else throw sw;
      }

      const prov  = new ethers.BrowserProvider(window.ethereum);
      const sign  = await prov.getSigner();
      const net   = await prov.getNetwork();
      const addr  = accounts[0];

      setProvider(prov); setSigner(sign); setAccount(addr);
      setNetwork(net); setWalletType("metamask");
      setContract(attachContract(sign));
      await refreshBalance(addr, prov);
      localStorage.setItem("dp_wallet", "metamask");
    } catch (err) {
      setError(err.message || "MetaMask connection failed");
    } finally { setIsConnecting(false); }
  }, [attachContract, refreshBalance]);

  // ── Dummy wallet connect ───────────────────────────────────────
  const connectDummyWallet = useCallback(async (privateKey) => {
    setError(null); setIsConnecting(true);
    try {
      if (!privateKey) throw new Error("Private key is required for dummy wallet");
      const jsonProv = new ethers.JsonRpcProvider(RPC_URL);
      const sign     = new ethers.Wallet(privateKey, jsonProv);
      const net      = await jsonProv.getNetwork();

      setProvider(jsonProv); setSigner(sign); setAccount(sign.address);
      setNetwork(net); setWalletType("dummy");
      setContract(attachContract(sign));
      await refreshBalance(sign.address, jsonProv);

      // Only store wallet type — NEVER store the private key in localStorage
      localStorage.setItem("dp_wallet", "dummy");
    } catch (err) {
      setError(err.message || "Dummy wallet connection failed");
    } finally { setIsConnecting(false); }
  }, [attachContract, refreshBalance]);

  // ── Generate new dummy wallet ──────────────────────────────────
  const generateWallet = useCallback(() => {
    const wallet = ethers.Wallet.createRandom();
    return {
      address:    wallet.address,
      privateKey: wallet.privateKey,
      mnemonic:   wallet.mnemonic?.phrase,
    };
  }, []);

  // ── Disconnect ─────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setAccount(null); setBalance("0"); setProvider(null);
    setSigner(null); setContract(null); setNetwork(null);
    setWalletType(null);
    localStorage.removeItem("dp_wallet");
  }, []);

  // ── Send payment ───────────────────────────────────────────────
  const sendPayment = useCallback(async ({ recipient, amountEth, message = "" }) => {
    if (!contract || !signer) throw new Error("Wallet not connected");
    if (!ethers.isAddress(recipient))  throw new Error("Invalid recipient address");
    const amt = parseFloat(amountEth);
    if (isNaN(amt) || amt <= 0)        throw new Error("Amount must be > 0");

    const value = ethers.parseEther(amountEth.toString());
    const tx    = await contract.sendPayment(recipient, message, { value });
    return tx;
  }, [contract, signer]);

  // ── Split payment ──────────────────────────────────────────────
  const splitPayment = useCallback(async ({ recipients, amounts, groupNote = "" }) => {
    if (!contract || !signer) throw new Error("Wallet not connected");
    if (recipients.length !== amounts.length) throw new Error("Recipients and amounts length mismatch");

    const parsedAmounts = amounts.map(a => ethers.parseEther(a.toString()));
    const total = parsedAmounts.reduce((s, a) => s + a, 0n);

    const tx = await contract.splitPayment(recipients, parsedAmounts, groupNote, { value: total });
    return tx;
  }, [contract, signer]);

  // ── Fetch on-chain history ─────────────────────────────────────
  const fetchHistory = useCallback(async (address) => {
    if (!contract || !provider) return [];
    const [sent, received] = await Promise.all([
      contract.queryFilter(contract.filters.PaymentSent(address, null), -10000),
      contract.queryFilter(contract.filters.PaymentSent(null, address), -10000),
    ]);
    return [...sent, ...received]
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .map(e => ({
        hash:      e.transactionHash,
        from:      e.args.from,
        to:        e.args.to,
        amount:    ethers.formatEther(e.args.amount),
        message:   e.args.message,
        timestamp: Number(e.args.timestamp),
        direction: e.args.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
      }));
  }, [contract, provider]);

  // ── Auto-reconnect MetaMask session ───────────────────────────
  useEffect(() => {
    if (localStorage.getItem("dp_wallet") === "metamask") connectMetaMask();
  }, []); // eslint-disable-line

  // ── MetaMask event listeners ───────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs) => {
      if (accs.length === 0) disconnectWallet();
      else { setAccount(accs[0]); refreshBalance(accs[0], provider); }
    };
    const onChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [provider, disconnectWallet, refreshBalance]);

  const isCorrectNetwork = network?.chainId === SEPOLIA_CHAIN_INT || network?.chainId === LOCAL_CHAIN_INT;

  return (
    <Web3Context.Provider value={{
      account, balance, network, provider, signer, contract,
      walletType, isConnecting, error, isCorrectNetwork,
      clearError, connectMetaMask, connectDummyWallet,
      generateWallet, disconnectWallet,
      sendPayment, splitPayment, fetchHistory,
      refreshBalance: () => refreshBalance(account, provider),
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be inside <Web3Provider>");
  return ctx;
};
