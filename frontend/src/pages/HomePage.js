import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";

export default function HomePage() {
  const { account, connectMetaMask, connectDummyWallet, generateWallet, isConnecting, error } = useWeb3();
  const navigate = useNavigate();
  const [mode, setMode]         = useState(null); // "metamask" | "dummy"
  const [privateKey, setPrivKey] = useState("");
  const [generated, setGenerated] = useState(null);

  React.useEffect(() => { if (account) navigate("/dashboard"); }, [account, navigate]);

  const handleGenerate = () => {
    const w = generateWallet();
    setGenerated(w);
    setPrivKey(w.privateKey);
  };

  return (
    <div style={{ maxWidth: 520, margin: "60px auto 0", padding: "0 16px", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>⬡</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111827", marginBottom: 10 }}>DecentraPay</h1>
      <p style={{ fontSize: 17, color: "#6b7280", marginBottom: 6 }}>
        Decentralised payments on Ethereum — no bank required.
      </p>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 36 }}>
        Sepolia testnet · Smart contract secured · Split payments · QR pay
      </p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {!mode && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          <WalletOption icon="🦊" title="MetaMask" sub="Browser extension" onClick={() => setMode("metamask")} />
          <WalletOption icon="🔑" title="Dummy Wallet" sub="For development" onClick={() => setMode("dummy")} />
        </div>
      )}

      {mode === "metamask" && (
        <div style={card}>
          <h3 style={{ marginBottom: 8 }}>Connect MetaMask</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Make sure MetaMask is installed and set to Sepolia testnet.
          </p>
          <button onClick={connectMetaMask} disabled={isConnecting} style={btnPrimary}>
            {isConnecting ? "Connecting…" : "🦊 Connect MetaMask"}
          </button>
          <button onClick={() => setMode(null)} style={btnGhost}>← Back</button>
        </div>
      )}

      {mode === "dummy" && (
        <div style={card}>
          <h3 style={{ marginBottom: 8 }}>Dummy Wallet</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Enter a private key or generate a fresh wallet. <strong>Never use real funds.</strong>
          </p>
          <button onClick={handleGenerate} style={{ ...btnGhost, marginBottom: 12 }}>
            ✨ Generate New Wallet
          </button>

          {generated && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 12, textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#065f46", marginBottom: 4 }}>ADDRESS</p>
              <p style={{ fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", color: "#374151", marginBottom: 8 }}>{generated.address}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>⚠ PRIVATE KEY — save this now</p>
              <p style={{ fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", color: "#374151" }}>{generated.privateKey}</p>
            </div>
          )}

          <input
            placeholder="Paste private key (0x…)"
            value={privateKey}
            onChange={e => setPrivKey(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: "monospace", marginBottom: 12 }}
          />
          <button
            onClick={() => connectDummyWallet(privateKey)}
            disabled={!privateKey || isConnecting}
            style={{ ...btnPrimary, opacity: (!privateKey || isConnecting) ? 0.6 : 1 }}
          >
            {isConnecting ? "Connecting…" : "🔑 Use This Wallet"}
          </button>
          <button onClick={() => setMode(null)} style={btnGhost}>← Back</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 56 }}>
        {[
          ["🔐", "Non-custodial", "Your keys, your coins"],
          ["⚡", "Instant",       "On-chain in seconds"],
          ["📊", "Split & Track", "Group payments + analytics"],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ background: "#f9fafb", borderRadius: 12, padding: "18px 14px" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{title}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const WalletOption = ({ icon, title, sub, onClick }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "20px 16px", border: "2px solid #e5e7eb",
    borderRadius: 14, background: "#fff", cursor: "pointer", transition: "all 0.15s",
  }}
    onMouseOver={e => e.currentTarget.style.borderColor = "#4f46e5"}
    onMouseOut={e => e.currentTarget.style.borderColor = "#e5e7eb"}
  >
    <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{title}</div>
    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</div>
  </button>
);

const card      = { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: 16, textAlign: "left" };
const btnPrimary = { width: "100%", padding: "12px 0", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 8 };
const btnGhost   = { width: "100%", padding: "10px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 8 };
