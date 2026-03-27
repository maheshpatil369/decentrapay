import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useUser } from "../context/Usercontext";
import { shortenAddress } from "../utils/format";

export default function Navbar() {
  const { account, balance, isConnecting, connectMetaMask, disconnectWallet, walletType } = useWeb3();
  const { getUsername } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const username = account ? getUsername(account) : null;

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "⊞" },
    { to: "/send",      label: "Send",      icon: "↑" },
    { to: "/split",     label: "Split",     icon: "÷" },
    { to: "/history",   label: "History",   icon: "📋" },
    { to: "/analytics", label: "Analytics", icon: "📊" },
    { to: "/qr",        label: "QR Pay",    icon: "⬛" },
  ];

  return (
    <nav style={styles.nav}>
      {/* Brand */}
      <Link to="/" style={styles.brand}>
        <span style={styles.brandIcon}>⬡</span>
        <span>DecentraPay</span>
      </Link>

      {/* Nav links (desktop) */}
      {account && (
        <div style={styles.links}>
          {navLinks.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to} to={to}
                style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
              >
                {label}
                {active && <span style={styles.activeDot} />}
              </Link>
            );
          })}
        </div>
      )}

      {/* Right side */}
      <div style={styles.right}>
        {account ? (
          <>
            {/* Wallet type badge */}
            <span style={{
              ...styles.typeBadge,
              background: walletType === "metamask" ? "#fef3c7" : "#ede9fe",
              color: walletType === "metamask" ? "#92400e" : "#5b21b6",
            }}>
              {walletType === "metamask" ? "🦊" : "🔑"}
              {walletType === "metamask" ? "MetaMask" : "Dummy"}
            </span>

            {/* Balance */}
            <span style={styles.balance}>
              {parseFloat(balance).toFixed(4)} ETH
            </span>

            {/* Account button */}
            <button
              onClick={() => navigate("/dashboard")}
              style={styles.accountBtn}
            >
              <span style={styles.accountAvatar}>
                {username ? username[0].toUpperCase() : account.slice(2, 4).toUpperCase()}
              </span>
              <span style={styles.accountLabel}>
                {username ? `@${username}` : shortenAddress(account)}
              </span>
            </button>

            {/* Disconnect */}
            <button onClick={disconnectWallet} style={styles.disconnectBtn}>
              Disconnect
            </button>
          </>
        ) : (
          <button onClick={connectMetaMask} disabled={isConnecting} style={styles.connectBtn}>
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", height: 60,
    borderBottom: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
    position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  brand: {
    display: "flex", alignItems: "center", gap: 8,
    fontWeight: 800, fontSize: 17, color: "#6366f1",
    textDecoration: "none", letterSpacing: "-0.02em",
  },
  brandIcon: { fontSize: 22 },
  links: { display: "flex", gap: 4, alignItems: "center" },
  link: {
    position: "relative", textDecoration: "none", color: "#6b7280",
    fontWeight: 500, fontSize: 14, padding: "6px 10px", borderRadius: 8,
    transition: "color 0.15s, background 0.15s",
  },
  linkActive: { color: "#6366f1", background: "#eef2ff", fontWeight: 600 },
  activeDot: {
    position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
    width: 4, height: 4, borderRadius: "50%", background: "#6366f1",
  },
  right: { display: "flex", alignItems: "center", gap: 10 },
  typeBadge: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, padding: "3px 9px", borderRadius: 999, fontWeight: 700,
  },
  balance: { fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'JetBrains Mono', monospace" },
  accountBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f3f4f6", border: "none", borderRadius: 999,
    padding: "5px 14px 5px 5px", cursor: "pointer",
    transition: "background 0.15s",
  },
  accountAvatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff", fontSize: 11, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  accountLabel: { fontSize: 13, fontWeight: 600, color: "#111827" },
  disconnectBtn: {
    background: "#fef2f2", color: "#b91c1c", border: "none",
    borderRadius: 999, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  connectBtn: {
    background: "#6366f1", color: "#fff", border: "none",
    borderRadius: 999, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
};