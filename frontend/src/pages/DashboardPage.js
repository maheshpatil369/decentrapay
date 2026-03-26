import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress, formatEth } from "../utils/format";

export default function DashboardPage() {
  const { account, balance, contract, refreshBalance, walletType } = useWeb3();
  const [stats, setStats]  = useState({ sent: "0", received: "0", count: "0" });
  const [volume, setVolume] = useState("0");

  useEffect(() => {
    async function load() {
      if (!contract || !account) return;
      try {
        const { ethers } = await import("ethers");
        const [sent, received, count] = await contract.walletStats(account);
        const total = await contract.totalVolume();
        setStats({
          sent:     ethers.formatEther(sent),
          received: ethers.formatEther(received),
          count:    count.toString(),
        });
        setVolume(ethers.formatEther(total));
      } catch { /* rpc may not be ready */ }
    }
    load();
  }, [contract, account]);

  const actions = [
    { to: "/send",      icon: "↑", label: "Send ETH",     bg: "#ede9fe", color: "#5b21b6" },
    { to: "/split",     icon: "÷", label: "Split",        bg: "#fef3c7", color: "#92400e" },
    { to: "/history",   icon: "📋", label: "History",     bg: "#dbeafe", color: "#1e40af" },
    { to: "/analytics", icon: "📊", label: "Analytics",   bg: "#d1fae5", color: "#065f46" },
    { to: "/qr",        icon: "⬛", label: "QR Pay",      bg: "#fce7f3", color: "#9d174d" },
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            {shortenAddress(account)} ·{" "}
            <span style={{ color: walletType === "metamask" ? "#d97706" : "#7c3aed" }}>
              {walletType === "metamask" ? "🦊 MetaMask" : "🔑 Dummy wallet"}
            </span>
          </p>
        </div>
        <button onClick={refreshBalance} style={{ padding: "7px 14px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Balance card */}
      <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius: 20, padding: "28px 28px 24px", marginBottom: 20, color: "#fff" }}>
        <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>Wallet balance (Sepolia ETH)</p>
        <p style={{ fontSize: 44, fontWeight: 800, margin: "8px 0 0" }}>
          {parseFloat(balance).toFixed(4)} <span style={{ fontSize: 22, fontWeight: 400 }}>ETH</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          ["Total sent",       `${formatEth(stats.sent)} ETH`,      "#ef4444"],
          ["Total received",   `${formatEth(stats.received)} ETH`,  "#10b981"],
          ["Transactions",     stats.count,                          "#6366f1"],
          ["Contract volume",  `${formatEth(volume)} ETH`,          "#f59e0b"],
        ].map(([label, value, accent]) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderTop: `3px solid ${accent}` }}>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "6px 0 0" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick action grid */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Quick actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {actions.map(({ to, icon, label, bg, color }) => (
          <Link key={to} to={to} style={{ textDecoration: "none" }}>
            <div style={{ background: bg, borderRadius: 14, padding: "20px 12px", textAlign: "center", transition: "transform 0.1s" }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
