import React, { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress, formatDate } from "../utils/format";

const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";

export default function HistoryPage() {
  const { account, fetchHistory } = useWeb3();
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetchHistory(account)
      .then(h => { setTxs(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, [account, fetchHistory]);

  const filtered = filter === "all" ? txs : txs.filter(t => t.direction === filter);

  if (loading) return <p style={{ textAlign: "center", marginTop: 60, color: "#9ca3af" }}>Scanning blockchain events…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Transaction history</h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>{filtered.length} transactions</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all","out","in"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", border: "none", borderRadius: 999, fontWeight: 600, fontSize: 12, cursor: "pointer",
              background: filter === f ? "#4f46e5" : "#f3f4f6",
              color: filter === f ? "#fff" : "#374151",
            }}>
              {f === "all" ? "All" : f === "out" ? "Sent" : "Received"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, background: "#f9fafb", borderRadius: 16, color: "#9ca3af" }}>
          📭 No transactions found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(tx => (
            <div key={tx.hash} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: tx.direction === "out" ? "#fee2e2" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {tx.direction === "out" ? "↑" : "↓"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: tx.direction === "out" ? "#b91c1c" : "#065f46" }}>
                  {tx.direction === "out" ? "-" : "+"}{parseFloat(tx.amount).toFixed(6)} ETH
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  {tx.direction === "out" ? `To: ${shortenAddress(tx.to)}` : `From: ${shortenAddress(tx.from)}`}
                  {tx.message && <span style={{ marginLeft: 8, fontStyle: "italic" }}>"{tx.message}"</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(tx.timestamp)}</div>
                <a href={`${EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#4f46e5", textDecoration: "none" }}>View ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
