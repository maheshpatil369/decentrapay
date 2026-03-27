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

  const contractRef = useRef(null);
  const providerRef = useRef(null);
  const accountRef  = useRef(null);
  const signerRef   = useRef(null);

  useEffect(() => { contractRef.current = contract; }, [contract]);
  useEffect(() => { providerRef.current = provider; }, [provider]);
  useEffect(() => { accountRef.current  = account;  }, [account]);
  useEffect(() => { signerRef.current   = signer;   }, [signer]);

  const clearError = () => setError(null);

  const refreshBalance = useCallback(async (addrArg, provArg) => {
    const addr = addrArg ?? accountRef.current;
    const prov = provArg ?? providerRef.current;
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
  const sendPayment = useCallback(async ({ recipient, amountEth, message = "" }) => {
    const ct   = contractRef.current;
    const sign = signerRef.current;
    if (!ct || !sign) throw new Error("Wallet not connected");
    if (!ethers.isAddress(recipient)) throw new Error("Invalid recipient address");

    const amt = parseFloat(amountEth);
    if (isNaN(amt) || amt <= 0) throw new Error("Amount must be > 0");

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
  }, []);

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
  }, []);

  // ── Fetch on-chain history ─────────────────────────────────────────────────
  // ROOT CAUSE OF BUG:
  //   iface.parseLog() returns only decoded args — it does NOT have .transactionHash.
  //   That field only exists on the raw log object.
  //   Old code did `e.transactionHash` on the parsed result → always undefined.
  //   Fix: keep rawLog and parsed result paired; read hash from rawLog.
  const fetchHistory = useCallback(async (address) => {
    const prov = providerRef.current;
    if (!prov) return [];

    try {
      const iface = new ethers.Interface(CONTRACT_ABI);

      // Compute topic0 = keccak256("PaymentSent(address,address,uint256,string,uint256)")
      // This filters at the node so only PaymentSent logs come back.
      const topic0 = ethers.id("PaymentSent(address,address,uint256,string,uint256)");

      const rawLogs = await prov.getLogs({
        address:   CONTRACT_ADDRESS,
        topics:    [topic0],
        fromBlock: 0,
        toBlock:   "latest",
      });

      console.log(`[fetchHistory] raw PaymentSent logs: ${rawLogs.length}`);

      const results = [];

      for (const rawLog of rawLogs) {
        try {
          // Parse only topics + data; the decoded result has args but NO transactionHash.
          const parsed = iface.parseLog({
            topics: rawLog.topics,
            data:   rawLog.data,
          });

          if (!parsed) continue;

          // args by position (safer than by name for some ethers versions)
          const from = parsed.args[0];  // address indexed
          const to   = parsed.args[1];  // address indexed
          const amt  = parsed.args[2];  // uint256
          const msg  = parsed.args[3];  // string
          const ts   = parsed.args[4];  // uint256

          const isMe =
            from.toLowerCase() === address.toLowerCase() ||
            to.toLowerCase()   === address.toLowerCase();

          if (!isMe) continue;

          results.push({
            hash:      rawLog.transactionHash,   // ← MUST come from rawLog
            from,
            to,
            amount:    ethers.formatEther(amt),
            message:   msg,
            timestamp: Number(ts),
            direction: from.toLowerCase() === address.toLowerCase() ? "out" : "in",
          });
        } catch (parseErr) {
          console.warn("[fetchHistory] skipping unparseable log:", parseErr.message);
        }
      }

      console.log(`[fetchHistory] results for ${address.slice(0,8)}: ${results.length}`);
      return results.sort((a, b) => b.timestamp - a.timestamp);

    } catch (err) {
      console.error("[fetchHistory] getLogs failed:", err);
      return [];
    }
  }, []);

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