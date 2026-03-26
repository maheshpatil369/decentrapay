import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../utils/format";

const navLink = { textDecoration: "none", color: "#374151", fontWeight: 500, fontSize: 14 };

export default function Navbar() {
  const { account, balance, isConnecting, connectMetaMask, disconnectWallet, walletType } = useWeb3();
  const navigate = useNavigate();

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px", borderBottom: "1px solid #e5e7eb",
      background: "#fff", position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <Link to="/" style={{ fontWeight: 800, fontSize: 18, color: "#4f46e5", textDecoration: "none" }}>
        ⬡ DecentraPay
      </Link>

      {account && (
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[
            ["/dashboard", "Dashboard"],
            ["/send",      "Send"],
            ["/split",     "Split"],
            ["/history",   "History"],
            ["/analytics", "Analytics"],
            ["/qr",        "QR Pay"],
          ].map(([to, label]) => (
            <Link key={to} to={to} style={navLink}>{label}</Link>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {account ? (
          <>
            <span style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 999,
              background: walletType === "metamask" ? "#fef3c7" : "#ede9fe",
              color: walletType === "metamask" ? "#92400e" : "#5b21b6",
              fontWeight: 600,
            }}>
              {walletType === "metamask" ? "🦊 MetaMask" : "🔑 Dummy"}
            </span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {parseFloat(balance).toFixed(4)} ETH
            </span>
            <button onClick={() => navigate("/dashboard")} style={pill("#f3f4f6", "#111827")}>
              {shortenAddress(account)}
            </button>
            <button onClick={disconnectWallet} style={pill("#fee2e2", "#b91c1c")}>
              Disconnect
            </button>
          </>
        ) : (
          <button onClick={connectMetaMask} disabled={isConnecting} style={pill("#4f46e5", "#fff")}>
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}

const pill = (bg, color) => ({
  background: bg, color, border: "none", borderRadius: 999,
  padding: "7px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer",
});
