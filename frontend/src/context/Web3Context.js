import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../abi/DecentraPay";

const SEPOLIA_CHAIN_ID  = "0xaa36a7";
const SEPOLIA_CHAIN_INT = 11155111n;
const LOCAL_CHAIN_INT   = 31337n;
const RPC_URL           = process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account,      setAccount]      = useState(null);
  const [balance,      setBalance]      = useState("0");
  const [provider,     setProvider]     = useState(null);
  const [signer,       setSigner]       = useState(null);
  const [contract,     setContract]     = useState(null);
  const [network,      setNetwork]      = useState(null);
  const [walletType,   setWalletType]   = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);

  // ── Keep always-fresh refs so callbacks never capture stale state ──────────
  // This fixes the "stale closure" bug where sendPayment/splitPayment/
  // refreshBalance captured null contract/provider/account values.
  const contractRef = useRef(null);
  const providerRef = useRef(null);
  const accountRef  = useRef(null);
  const signerRef   = useRef(null);

  useEffect(() => { contractRef.current = contract; }, [contract]);
  useEffect(() => { providerRef.current = provider; }, [provider]);
  useEffect(() => { accountRef.current  = account;  }, [account]);
  useEffect(() => { signerRef.current   = signer;   }, [signer]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const clearError = () => setError(null);

  const refreshBalance = useCallback(async (addrArg, provArg) => {
    // Accept explicit args OR fall back to the always-fresh refs
    const addr = addrArg  ?? accountRef.current;
    const prov = provArg  ?? providerRef.current;
    if (!addr || !prov) return;
    try {
      const raw = await prov.getBalance(addr);
      setBalance(ethers.formatEther(raw));
    } catch { /* non-critical */ }
  }, []);

  const attachContract = useCallback(
    (signerOrProvider) =>
      new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider),
    [],
  );

  // ── MetaMask connect ───────────────────────────────────────────────────────
  const connectMetaMask = useCallback(async () => {
    setError(null); setIsConnecting(true);
    try {
      if (!window.ethereum)
        throw new Error("MetaMask not installed. Get it at metamask.io");

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

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

      const prov = new ethers.BrowserProvider(window.ethereum);
      const sign = await prov.getSigner();
      const net  = await prov.getNetwork();
      const addr = accounts[0];
      const ct   = attachContract(sign);

      setProvider(prov); setSigner(sign); setAccount(addr);
      setNetwork(net);   setWalletType("metamask"); setContract(ct);
      await refreshBalance(addr, prov);
      localStorage.setItem("dp_wallet", "metamask");
    } catch (err) {
      setError(err.message || "MetaMask connection failed");
    } finally { setIsConnecting(false); }
  }, [attachContract, refreshBalance]);

  // ── Dummy wallet connect ───────────────────────────────────────────────────
  const connectDummyWallet = useCallback(async (privateKey) => {
    setError(null); setIsConnecting(true);
    try {
      if (!privateKey)
        throw new Error("Private key is required");

      const jsonProv = new ethers.JsonRpcProvider(RPC_URL);

      // Validate the RPC is reachable before continuing
      try {
        await jsonProv.getBlockNumber();
      } catch {
        throw new Error(
          `Cannot reach local node at ${RPC_URL}. ` +
          "Make sure Hardhat is running: npx hardhat node"
        );
      }

      const sign = new ethers.Wallet(privateKey, jsonProv);
      const net  = await jsonProv.getNetwork();
      const ct   = attachContract(sign);

      // Check balance and warn if zero
      const raw = await jsonProv.getBalance(sign.address);
      const bal = ethers.formatEther(raw);
      if (parseFloat(bal) === 0) {
        console.warn(
          `[DecentraPay] Wallet ${sign.address} has 0 ETH on ${RPC_URL}. ` +
          "Fund it from a Hardhat account:\n" +
          `  npx hardhat --network localhost send-eth --to ${sign.address} --amount 1`
        );
      }

      setProvider(jsonProv); setSigner(sign); setAccount(sign.address);
      setNetwork(net); setWalletType("dummy"); setContract(ct);
      setBalance(bal);
      localStorage.setItem("dp_wallet", "dummy");
    } catch (err) {
      setError(err.message || "Dummy wallet connection failed");
    } finally { setIsConnecting(false); }
  }, [attachContract]);

  // ── Generate new dummy wallet ──────────────────────────────────────────────
  const generateWallet = useCallback(() => {
    const wallet = ethers.Wallet.createRandom();
    return {
      address:    wallet.address,
      privateKey: wallet.privateKey,
      mnemonic:   wallet.mnemonic?.phrase,
    };
  }, []);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setAccount(null); setBalance("0"); setProvider(null);
    setSigner(null);  setContract(null); setNetwork(null);
    setWalletType(null);
    localStorage.removeItem("dp_wallet");
  }, []);

  // ── Send payment ───────────────────────────────────────────────────────────
  // Uses refs instead of closure-captured state to avoid stale null values.
  const sendPayment = useCallback(async ({ recipient, amountEth, message = "" }) => {
    const ct   = contractRef.current;
    const sign = signerRef.current;
    if (!ct || !sign) throw new Error("Wallet not connected");
    if (!ethers.isAddress(recipient)) throw new Error("Invalid recipient address");

    const amt = parseFloat(amountEth);
    if (isNaN(amt) || amt <= 0) throw new Error("Amount must be > 0");

    // Check balance before sending to give a friendlier error
    const prov = providerRef.current;
    const addr = accountRef.current;
    if (prov && addr) {
      const raw = await prov.getBalance(addr);
      const bal = parseFloat(ethers.formatEther(raw));
      if (bal < amt) {
        throw new Error(
          `Insufficient balance. You have ${bal.toFixed(6)} ETH but tried to send ${amt} ETH.\n\n` +
          "Fund your dummy wallet from a Hardhat account:\n" +
          `  npx hardhat --network localhost send-eth --to ${addr} --amount 1`
        );
      }
    }

    const value = ethers.parseEther(amountEth.toString());
    const tx    = await ct.sendPayment(recipient, message, { value });
    return tx;
  }, []); // intentionally no deps — uses refs

  // ── Split payment ──────────────────────────────────────────────────────────
  const splitPayment = useCallback(async ({ recipients, amounts, groupNote = "" }) => {
    const ct   = contractRef.current;
    const sign = signerRef.current;
    if (!ct || !sign) throw new Error("Wallet not connected");
    if (recipients.length !== amounts.length)
      throw new Error("Recipients and amounts length mismatch");

    const parsedAmounts = amounts.map(a => ethers.parseEther(a.toString()));
    const total = parsedAmounts.reduce((s, a) => s + a, 0n);

    const tx = await ct.splitPayment(recipients, parsedAmounts, groupNote, { value: total });
    return tx;
  }, []); // intentionally no deps — uses refs

  // ── Fetch on-chain history ─────────────────────────────────────────────────
  const fetchHistory = useCallback(async (address) => {
    const ct   = contractRef.current;
    const prov = providerRef.current;
    if (!ct || !prov) return [];

    try {
      const [sent, received] = await Promise.all([
        ct.queryFilter(ct.filters.PaymentSent(address, null), -10000),
        ct.queryFilter(ct.filters.PaymentSent(null, address), -10000),
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
    } catch (err) {
      console.error("[fetchHistory]", err);
      return [];
    }
  }, []); // intentionally no deps — uses refs

  // ── Auto-reconnect MetaMask session ───────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem("dp_wallet") === "metamask") connectMetaMask();
  }, []); // eslint-disable-line

  // ── MetaMask event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs) => {
      if (accs.length === 0) disconnectWallet();
      else {
        setAccount(accs[0]);
        refreshBalance(accs[0], providerRef.current);
      }
    };
    const onChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [disconnectWallet, refreshBalance]);

  const isCorrectNetwork =
    network?.chainId === SEPOLIA_CHAIN_INT ||
    network?.chainId === LOCAL_CHAIN_INT;

  return (
    <Web3Context.Provider value={{
      account, balance, network, provider, signer, contract,
      walletType, isConnecting, error, isCorrectNetwork,
      clearError, connectMetaMask, connectDummyWallet,
      generateWallet, disconnectWallet,
      sendPayment, splitPayment, fetchHistory,
      // Always-fresh balance refresh — safe to call anywhere
      refreshBalance: () => refreshBalance(),
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