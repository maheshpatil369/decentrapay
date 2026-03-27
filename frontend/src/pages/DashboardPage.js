import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useUser } from "../context/Usercontext";
import { shortenAddress, formatEth } from "../utils/format";

export default function DashboardPage() {
  const { account, balance, contract, refreshBalance, walletType } = useWeb3();
  const { getUsername, setUsername } = useUser();
  const [stats,  setStats]  = useState({ sent: "0", received: "0", count: "0" });
  const [volume, setVolume] = useState("0");
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [unameErr, setUnameErr] = useState("");

  const username = getUsername(account);

useEffect(() => {
  async function load() {
    if (!account) return;

    try {
      const { fetchHistory } = await import("../context/Web3Context");
    } catch {}

    try {
      // 🔥 GET BLOCKCHAIN TX
      const chainTxs = await contract?.provider
        ? await contract.provider.getBlockNumber().then(() => [])
        : [];

      // ❗ Actually use fetchHistory instead
      const { fetchHistory } = require("../context/Web3Context");

    } catch {}

    try {
      // ✅ PROPER WAY
      const history = JSON.parse(localStorage.getItem("txHistory")) || [];

      let sent = 0;
      let received = 0;

      history.forEach(tx => {
        sent += parseFloat(tx.amount);
      });

      setStats({
        sent: sent.toString(),
        received: received.toString(),
        count: history.length.toString(),
      });

      setVolume(sent.toString());

    } catch (err) {
      console.error(err);
    }
  }

  load();
}, [account]);

  const saveUsername = () => {
    const t = newUsername.trim();
    if (!t || t.length < 3) { setUnameErr("Min 3 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(t)) { setUnameErr("Letters, numbers, underscore only"); return; }
    setUsername(account, t);
    setEditingUsername(false);
    setUnameErr("");
  };

  const actions = [
    { to: "/send",      icon: "↑", label: "Send ETH",   bg: "#ede9fe", color: "#5b21b6", desc: "Transfer ETH" },
    { to: "/split",     icon: "÷", label: "Split",       bg: "#fef3c7", color: "#92400e", desc: "Split a bill"  },
    { to: "/history",   icon: "📋", label: "History",    bg: "#dbeafe", color: "#1e40af", desc: "View txns"    },
    { to: "/analytics", icon: "📊", label: "Analytics",  bg: "#d1fae5", color: "#065f46", desc: "Track volume" },
    { to: "/qr",        icon: "⬛", label: "QR Pay",     bg: "#fce7f3", color: "#9d174d", desc: "Scan & pay"   },
  ];

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={styles.bigAvatar}>
            {username ? username[0].toUpperCase() : account?.slice(2, 4).toUpperCase()}
          </div>
          <div>
            {editingUsername ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>@</span>
                <input
                  autoFocus
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setUnameErr(""); }}
                  onKeyDown={e => { if (e.key === "Enter") saveUsername(); if (e.key === "Escape") setEditingUsername(false); }}
                  style={styles.inlineInput}
                  placeholder="username"
                  maxLength={32}
                />
                <button style={styles.saveBtnSm} onClick={saveUsername}>Save</button>
                <button style={styles.cancelBtnSm} onClick={() => setEditingUsername(false)}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={styles.userName}>
                  {username ? `@${username}` : "No username set"}
                </h1>
                <button
                  style={styles.editBtn}
                  onClick={() => { setNewUsername(username || ""); setEditingUsername(true); }}
                  title="Edit username"
                >
                  ✏
                </button>
              </div>
            )}
            {unameErr && <p style={{ color: "#b91c1c", fontSize: 12, margin: "2px 0 0" }}>{unameErr}</p>}
            <p style={styles.addrLine}>
              {shortenAddress(account)} ·{" "}
              <span style={{ color: walletType === "metamask" ? "#d97706" : "#7c3aed" }}>
                {walletType === "metamask" ? "🦊 MetaMask" : "🔑 Dummy wallet"}
              </span>
            </p>
          </div>
        </div>
        <button onClick={refreshBalance} style={styles.refreshBtn}>↻ Refresh</button>
      </div>

      {/* Balance card */}
      <div style={styles.balanceCard}>
        <div>
          <p style={styles.balLabel}>Wallet balance</p>
          <p style={styles.balValue}>
            {parseFloat(balance).toFixed(4)}
            <span style={styles.balUnit}> ETH</span>
          </p>
        </div>
        <div style={styles.networkPill}>Sepolia / Hardhat</div>
      </div>

      {/* Stats row */}
      <div style={styles.statsGrid}>
        {[
          { label: "Total Sent",      value: `${formatEth(stats.sent)} ETH`,     accent: "#ef4444", icon: "↑" },
          { label: "Total Received",  value: `${formatEth(stats.received)} ETH`, accent: "#10b981", icon: "↓" },
          { label: "Transactions",    value: stats.count,                         accent: "#6366f1", icon: "#" },
          { label: "Contract Volume", value: `${formatEth(volume)} ETH`,          accent: "#f59e0b", icon: "⬡" },
        ].map(({ label, value, accent, icon }) => (
          <div key={label} style={{ ...styles.statCard, borderTop: `3px solid ${accent}` }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <p style={styles.statLabel}>{label}</p>
            <p style={{ ...styles.statValue, color: accent }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={styles.sectionTitle}>Quick Actions</h2>
      <div style={styles.actionsGrid}>
        {actions.map(({ to, icon, label, bg, color, desc }) => (
          <Link key={to} to={to} style={{ textDecoration: "none" }}>
            <div
              style={{ ...styles.actionCard, background: bg }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
              <div style={{ fontSize: 11, color: color + "aa", marginTop: 3 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24,
  },
  bigAvatar: {
    width: 56, height: 56, borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff", fontSize: 20, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
    flexShrink: 0,
  },
  userName: { fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 },
  editBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, color: "#9ca3af", padding: 2, borderRadius: 4,
  },
  addrLine: { fontSize: 13, color: "#9ca3af", margin: "4px 0 0", fontFamily: "'JetBrains Mono', monospace" },
  refreshBtn: {
    padding: "8px 16px", background: "#f3f4f6", border: "none",
    borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151",
  },
  inlineInput: {
    padding: "7px 10px", border: "2px solid #6366f1", borderRadius: 8,
    fontSize: 16, fontWeight: 700, outline: "none", width: 160,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  saveBtnSm: {
    padding: "6px 12px", background: "#6366f1", color: "#fff",
    border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  cancelBtnSm: {
    padding: "6px 10px", background: "#f3f4f6", color: "#374151",
    border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer",
  },

  balanceCard: {
    background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)",
    borderRadius: 20, padding: "28px 28px 24px",
    marginBottom: 24, color: "#fff",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
  },
  balLabel: { fontSize: 13, opacity: 0.8, margin: "0 0 6px", fontWeight: 500 },
  balValue: { fontSize: 48, fontWeight: 800, margin: 0, letterSpacing: "-0.03em", fontFamily: "'JetBrains Mono', monospace" },
  balUnit: { fontSize: 24, fontWeight: 400, opacity: 0.8 },
  networkPill: {
    background: "rgba(255,255,255,0.2)", borderRadius: 999,
    padding: "6px 14px", fontSize: 12, fontWeight: 600, backdropFilter: "blur(4px)",
    alignSelf: "flex-start",
  },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 },
  statCard: {
    background: "#fff", borderRadius: 14, padding: "18px 16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  statLabel: { fontSize: 11, color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" },

  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 14 },
  actionsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 8 },
  actionCard: {
    borderRadius: 16, padding: "22px 12px", textAlign: "center",
    transition: "transform 0.15s", cursor: "pointer",
  },
};