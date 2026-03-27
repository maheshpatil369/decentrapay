import React, { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useUser } from "../context/Usercontext";
import { shortenAddress, formatDate } from "../utils/format";

const EXPLORER = process.env.REACT_APP_EXPLORER || "https://sepolia.etherscan.io";

export default function HistoryPage() {
  const { account, fetchHistory } = useWeb3();
  const { getUsername } = useUser();
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
useEffect(() => {
  if (!account) return;

  setLoading(true);

  fetchHistory(account)
    .then(chainTxs => {

      // 🔥 GET LOCAL TX
      const local = JSON.parse(localStorage.getItem("txHistory")) || [];

      const localFormatted = local.map(tx => ({
        hash: tx.txHash,
        from: account,
        to: tx.recipient,
        amount: tx.amount,
        message: tx.message,
        timestamp: Math.floor(new Date(tx.time).getTime() / 1000),
        direction: "out"
      }));

      // 🔥 MERGE BOTH
      const all = [...chainTxs, ...localFormatted];

      // 🔥 REMOVE DUPLICATES
      const unique = Object.values(
        all.reduce((acc, tx) => {
          acc[tx.hash] = tx;
          return acc;
        }, {})
      );

      // 🔥 SORT
      unique.sort((a, b) => b.timestamp - a.timestamp);

      setTxs(unique);
      setLoading(false);
    })
    .catch(() => setLoading(false));

}, [account, fetchHistory]);

  const filtered = filter === "all" ? txs : txs.filter(t => t.direction === filter);

  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
      <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 12 }}>Scanning blockchain events…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Transaction History</h1>
          <p style={S.sub}>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={S.filterRow}>
          {[
            { key: "all", label: "All",      color: "#6366f1" },
            { key: "out", label: "↑ Sent",   color: "#ef4444" },
            { key: "in",  label: "↓ Received", color: "#10b981" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                ...S.filterBtn,
                background: filter === key ? color : "#f3f4f6",
                color:      filter === key ? "#fff" : "#374151",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>No transactions found</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>
            {filter !== "all" ? "Try switching the filter above" : "Send or receive ETH to see history here"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(tx => {
            const counterpart = tx.direction === "out" ? tx.to : tx.from;
            const counterUsername = getUsername(counterpart);

            return (
              <div key={tx.hash} style={S.txCard}>
                {/* Direction icon */}
                <div style={{
                  ...S.txIcon,
                  background: tx.direction === "out" ? "#fef2f2" : "#f0fdf4",
                  color: tx.direction === "out" ? "#ef4444" : "#10b981",
                }}>
                  {tx.direction === "out" ? "↑" : "↓"}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.txAmount}>
                    <span style={{ color: tx.direction === "out" ? "#ef4444" : "#10b981" }}>
                      {tx.direction === "out" ? "−" : "+"}
                      {parseFloat(tx.amount).toFixed(6)} ETH
                    </span>
                  </div>
                  <div style={S.txMeta}>
                    <span>
                      {tx.direction === "out" ? "To: " : "From: "}
                      {counterUsername
                        ? <><strong>@{counterUsername}</strong> <span style={{ color: "#d1d5db" }}>·</span> {shortenAddress(counterpart)}</>
                        : shortenAddress(counterpart)
                      }
                    </span>
                    {tx.message && (
                      <span style={S.msgPill}>
                        "{tx.message}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div style={S.txRight}>
                  <div style={S.txDate}>{formatDate(tx.timestamp)}</div>
                  <a
                    href={`${EXPLORER}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.txLink}
                  >
                    View ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  loadingWrap: { textAlign: "center", marginTop: 80 },
  spinner: {
    width: 32, height: 32, border: "3px solid #e5e7eb",
    borderTopColor: "#6366f1", borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 },
  sub:   { fontSize: 13, color: "#9ca3af", margin: "4px 0 0" },
  filterRow: { display: "flex", gap: 6 },
  filterBtn: {
    padding: "7px 14px", border: "none", borderRadius: 999,
    fontWeight: 600, fontSize: 12, cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Space Grotesk', sans-serif",
  },

  emptyState: {
    textAlign: "center", padding: 56,
    background: "#fafafa", borderRadius: 18,
    border: "1px solid #f0f0f0",
  },

  txCard: {
    display: "flex", alignItems: "center", gap: 14,
    background: "#fff", borderRadius: 14,
    padding: "14px 18px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
    border: "1px solid #f3f4f6",
    transition: "box-shadow 0.15s",
  },
  txIcon: {
    width: 40, height: 40, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, flexShrink: 0,
  },
  txAmount: { fontWeight: 700, fontSize: 16, marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" },
  txMeta: { fontSize: 12, color: "#6b7280", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  msgPill: {
    background: "#f3f4f6", borderRadius: 999,
    padding: "1px 8px", fontSize: 11, color: "#374151",
    fontStyle: "italic",
  },
  txRight: { textAlign: "right", flexShrink: 0 },
  txDate: { fontSize: 11, color: "#9ca3af", marginBottom: 3 },
  txLink: { fontSize: 11, color: "#6366f1", textDecoration: "none", fontWeight: 600 },
};